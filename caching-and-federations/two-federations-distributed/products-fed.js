const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const axios = require('axios');
const NodeCache = require('node-cache');
const { makeMongoCache } = require('./mongoCache');

const { memoization } = require('../index');

const mongoTtlInMs = 2 * 60 * 1000;

const mongoCache = makeMongoCache({ ttlInMs: mongoTtlInMs });

// cache
const cache = new NodeCache({ stdTTL: 2, checkperiod: 1 });

// schema
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

// api function to memoize
const getProducts = () => {
  console.log('running internal API call');
  return axios.get('http://localhost:4002/v2/').then((res) => res.data);
};

// wrapping function in mongo cache
const innerMemoFunc = memoization(
  () => {
    console.log('mongo cache missed');
    return getProducts();
  } /* inner function */,
  () => 'cacheKey' /* cache key function */,
  mongoCache
);

// wrapping the mongo cache with an in-memory cache
const outerMemoFunc = memoization(
  () => {
    console.log('in-memory cache missed');
    return innerMemoFunc();
  } /* inner function */,
  () => 'cacheKey' /* cache key function */,
  cache
);
// resolvers
const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find((product) => product.upc === object.upc);
    },
  },
  Query: {
    async topProducts(_, args) {
      return (await outerMemoFunc()).products.splice(0, args.first);
    },
  },
};

// create server
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
