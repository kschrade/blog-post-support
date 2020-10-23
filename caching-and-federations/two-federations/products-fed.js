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
  extend type Query {
    topProducts(first: Int = 5): [Product]
  }
  type Product @key(fields: "upc") {
    upc: String!
    name: String
    price: Int
    weight: Int
  }
`;

const getProducts = (numberOfProducts) => {
  console.log('running internal function for Products federation');
  return axios
    .get('http://localhost:4002/v2')
    .then((res) => res.data.products.slice(0, numberOfProducts));
};

const memoizedFunc = memoization(
  getProducts /* inner function */,
  (numberOfProducts) => numberOfProducts.toString() /* cache key function */,
  cache
);

const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find((product) => product.upc === object.upc);
    },
  },
  Query: {
    topProducts(_, args) {
      return memoizedFunc(args.first);
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

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
