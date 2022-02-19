const Product = require('../models/Product');

const resolvers = {
  Query: {
    getProducts: async () => {
      return await Product.find();
    },
  },
};

module.exports = resolvers;
