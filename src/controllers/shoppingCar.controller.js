const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const shoppingCarRepository = require('../repositories/shoppingCar.repository');
const { shoppingCarCodeAlreadyExists } = require('../utils/utils');

// Create a new shopping car
exports.save = async function (req, input) {
  logger.log(req.originalUrl);
  try {
    if (await shoppingCarCodeAlreadyExists(input.code)) {
      throw new Error('Invalid shopping car code');
    } else {
      return await shoppingCarRepository.save(input);
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns all the shopping cars
exports.find = async function (req, skip, limit) {
  logger.log(req.originalUrl);
  try {
    const items = await shoppingCarRepository.find(skip || 0, limit || 25);
    if (items) {
      for (const i of items) {
        i.href = req.baseUrl.concat('/', i._id);
      }
      return items;
    }
    throw new Error('Unable to find shopping cars');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns a shopping car by an id provided
exports.findById = async function (req, id) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const shoppingCar = await shoppingCarRepository.findById(id);
      shoppingCar.href = req.originalUrl;
      return shoppingCar;
    }
    throw new Error('Invalid shopping car id');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Updates a shopping car
exports.update = async function (req, id, input) {
  logger.log(req.originalUrl);
  try {
    if (await shoppingCarCodeAlreadyExists(input.code)) {
      throw new Error('Invalid shopping car code');
    } else {
      const response = shoppingCarRepository.findByIdAndUpdate(id, input);
      return response;
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Deletes a shopping car by an id provided
exports.delete = async function (req, id) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const response = await shoppingCarRepository.findByIdAndDelete(id);
      return response;
    }
    throw new Error('Invalid shopping car id');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Add a given quantity of a product by shopping car's id and product's id
exports.addProduct = async function (req, id, pid, quantity) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(pid)) {
      return await shoppingCarRepository.addProductToShoppingCar(pid, id, quantity);
    }
    throw new Error('Invalid object ids');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Deletes a given quantity of a product in a shopping car
exports.deleteProduct = async function (req, id, pid, quantity) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(pid)) {
      return await shoppingCarRepository.deleteProductFromShoppingCar(pid, id, quantity);
    }
    throw new Error('Invalid object ids');
  } catch (err) {
    throw new Error(err.message);
  }
};
