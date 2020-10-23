const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const axios = require('axios');
const NodeCache = require('node-cache');

const { memoization } = require('../index');

const outerCache = new NodeCache({ stdTTL: 2, checkperiod: 1 });
const innerCache = new NodeCache({ stdTTL: 15, checkperiod: 2 });

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
  console.log('running internal function');
  return axios
    .get('http://localhost:4002/')
    .then((res) => res.data.slice(0, numberOfProducts));
};

const innerMemoFunc = memoization(
  (numberOfProducts) => {
    console.log('inner cache function missed');
    return getProducts(numberOfProducts);
  } /* inner function */,
  (numberOfProducts) => numberOfProducts.toString() /* cache key function */,
  innerCache
);

const outerMemoFunc = memoization(
  (numberOfProducts) => {
    console.log('outer cache function missed');
    return innerMemoFunc(numberOfProducts);
  } /* inner function */,
  (numberOfProducts) => numberOfProducts.toString() /* cache key function */,
  outerCache
);

const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find((product) => product.upc === object.upc);
    },
  },
  Query: {
    topProducts(_, args) {
      return outerMemoFunc(args.first);
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
