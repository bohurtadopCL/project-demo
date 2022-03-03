const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const productRepository = require('../repositories/product.repository');
const { isAValidCategory, isAValidPrice, productCodeAlreadyExists } = require('../utils/utils');

// Create a new product
exports.save = async function (req, input) {
  logger.log(req.originalUrl);
  try {
    if (await productCodeAlreadyExists(input.code)) {
      throw new Error('Invalid product code');
    } else if (!isAValidCategory(input.category)) {
      throw new Error('Invalid category');
    } else if (!isAValidPrice(input.price)) {
      throw new Error('Invalid price');
    } else {
      return await productRepository.save(input);
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns all the products
exports.find = async function (req, offset, limit) {
  logger.log(req.originalUrl);
  try {
    const products = await productRepository.find(offset || 0, limit || 25);
    for (const item of products) {
      item._doc = { href: req.baseUrl.concat('/', item._doc._id), ...item._doc };
    }
    return products;
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns a product by an id provided
exports.findById = async function (req, id) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const product = await productRepository.findById(id);
      product._doc = { href: req.originalUrl, ...product._doc };
      return product;
    }
    throw new Error('Invalid product id');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Updates a product
exports.update = async function (req, id, input) {
  logger.log(req.originalUrl);
  try {
    if (input.code && (await productCodeAlreadyExists(input.code))) {
      throw new Error('Invalid product code');
    } else if (!isAValidCategory(input.category)) {
      throw new Error('Invalid category');
    } else if (!isAValidPrice(input.price)) {
      throw new Error('Invalid price');
    } else {
      await productRepository.findByIdAndUpdate(id, input);
      input._id = id;
      return input;
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Deletes a product on database
exports.delete = async function (req, id) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const response = await productRepository.findByIdAndDelete(id);
      return response;
    }
    throw new Error('Invalid product id');
  } catch (err) {
    throw new Error(err.message);
  }
};
