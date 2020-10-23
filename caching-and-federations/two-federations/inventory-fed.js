const {
  ApolloServer,
  gql,
} = require('../distibuted-cache/node_modules/apollo-server');
const {
  buildFederatedSchema,
} = require('../distibuted-cache/node_modules/@apollo/federation');
const axios = require('../distibuted-cache/node_modules/axios');
const NodeCache = require('../distibuted-cache/node_modules/node-cache');

const { memoization } = require('../index');

const cache = new NodeCache();

const typeDefs = gql`
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const getInventory = () => {
  console.log('running internal function for Products federation');
  return axios
    .get('http://localhost:4002/v2/')
    .then((res) => res.data.inventory);
};

const memoizedFunc = memoization(
  getInventory /* inner function */,
  () => 'a-fancy-key' /* cache key function */,
  cache
);

const resolvers = {
  Product: {
    __resolveReference(object) {
      return memoizedFunc().then((inventory) => ({
        ...object,
        ...inventory.find((product) => product.upc === object.upc),
      }));
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
    },
  },
};

const server = new ApolloServer({
  context: () => {
    console.log('request hit product federations.');
  },
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
});

server.listen({ port: 4003 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
