const productsController = require('../controllers/products.controller');
const shoppingCarController = require('../controllers/shoppingCar.controller');

const resolvers = {
  Query: {
    getProducts: async (_, _input, _args) => {
      return await productsController.find(_args);
    },
    getProduct: async (_, { id }, _args) => {
      _args.params._id = id;
      return await productsController.findById(_args);
    },
    getShoppingCars: async (_, _input, _args) => {
      return await shoppingCarController.find(_args);
    },
    getShoppingCar: async (_, { id }, _args) => {
      _args.params._id = id;
      return await shoppingCarController.findById(_args);
    },
  },
  Mutation: {
    saveProduct: async (_, { input }, _args) => {
      _args.body = input;
      return await productsController.save(_args);
    },
    updateProduct: async (_, { id, input }, _args) => {
      _args.body = input;
      _args.params._id = id;
      return await productsController.update(_args);
    },
    deleteProduct: async (_, { id }, _args) => {
      _args.params._id = id;
      return await productsController.delete(_args);
    },
    saveShoppingCar: async (_, { input }, _args) => {
      _args.body = input;
      return await shoppingCarController.save(_args);
    },
    deleteShoppingCar: async (_, { id }, _args) => {
      _args.params._id = id;
      return await shoppingCarController.delete(_args);
    },
    addProductToShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      _args.params._id = shoppingCarId;
      _args.params._pid = productId;
      _args.body.quantity = quantity;
      return await shoppingCarController.addProduct(_args);
    },
    deleteProductFromShoppingCar: async (_, { shoppingCarId, productId, quantity }, _args) => {
      _args.params._id = shoppingCarId;
      _args.params._pid = productId;
      _args.body.quantity = quantity;
      return await shoppingCarController.deleteProduct(_args);
    },
  },
};

module.exports = resolvers;
