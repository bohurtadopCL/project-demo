const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `

    type Product {
        _id: String
        code: String
        name: String
        price: Int
        category: String
    }

    type Query {
        getProducts: [Product]
    }
`;

module.exports = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers,
});
