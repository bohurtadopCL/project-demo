const productController = require('../controllers/product.controller');
const shoppingCarController = require('../controllers/shoppingCar.controller');

const resolvers = {
  Query: {
    getProducts: async (_, { offset, limit }, _args) => {
      return await productController.find(_args, offset, limit);
    },
    getProduct: async (_, { id }, _args) => {
      return await productController.findById(_args, id);
    },
    getShoppingCars: async (_, { offset, limit }, _args) => {
      return await shoppingCarController.find(_args, offset, limit);
    },
    getShoppingCar: async (_, { id }, _args) => {
      return await shoppingCarController.findById(_args, id);
    },
  },
  Mutation: {
    saveProduct: async (_, { input }, _args) => {
      return await productController.save(_args, input);
    },
    updateProduct: async (_, { id, input }, _args) => {
      return await productController.update(_args, id, input);
    },
    deleteProduct: async (_, { id }, _args) => {
      return await productController.delete(_args, id);
    },
    saveShoppingCar: async (_, { input }, _args) => {
      return await shoppingCarController.save(_args, input);
    },
    deleteShoppingCar: async (_, { id }, _args) => {
      return await shoppingCarController.delete(_args, id);
    },
    addProductToShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      return await shoppingCarController.addProduct(_args, shoppingCarId, productId, quantity);
    },
    deleteProductFromShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      return await shoppingCarController.deleteProduct(_args, shoppingCarId, productId, quantity);
    },
  },
};

module.exports = resolvers;
