const productsRepository = require('../repositories/products.repository');
const shoppingCarsRepository = require('../repositories/shoppingCars.repository');

const resolvers = {
  Query: {
    getProducts: async (_, { offset, limit }, _args) => {
      return await productsRepository.find(_args, offset, limit);
    },
    getProduct: async (_, { id }, _args) => {
      return await productsRepository.findById(_args, id);
    },
    getShoppingCars: async (_, { offset, limit }, _args) => {
      return await shoppingCarsRepository.find(_args, offset, limit);
    },
    getShoppingCar: async (_, { id }, _args) => {
      return await shoppingCarsRepository.findById(_args, id);
    },
  },
  Mutation: {
    saveProduct: async (_, { input }, _args) => {
      return await productsRepository.save(_args, input);
    },
    updateProduct: async (_, { id, input }, _args) => {
      return await productsRepository.update(_args, id, input);
    },
    deleteProduct: async (_, { id }, _args) => {
      return await productsRepository.delete(_args, id);
    },
    saveShoppingCar: async (_, { input }, _args) => {
      return await shoppingCarsRepository.save(_args, input);
    },
    deleteShoppingCar: async (_, { id }, _args) => {
      return await shoppingCarsRepository.delete(_args, id);
    },
    addProductToShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      return await shoppingCarsRepository.addProduct(_args, shoppingCarId, productId, quantity);
    },
    deleteProductFromShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      return await shoppingCarsRepository.deleteProduct(_args, shoppingCarId, productId, quantity);
    },
  },
};

module.exports = resolvers;
