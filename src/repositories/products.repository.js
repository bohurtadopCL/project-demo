const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const client = require('../redis/redis');
const Product = require('../models/Product');
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
      const newProduct = new Product(input);
      const item = await newProduct.save();
      if (item) {
        return item;
      }
      throw new Error('Error saving product');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns all the products
exports.find = async function (req, offset, limit) {
  logger.log(req.originalUrl);
  try {
    const products = await Product.find()
      .skip(offset || 0)
      .limit(limit || 25);
    if (products) {
      for (const item of products) {
        item._doc = { href: req.baseUrl.concat('/', item._doc._id), ...item._doc };
      }
      return products;
    }
    throw new Error('Internal server error');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns a product by an id provided
exports.findById = async function (req, id) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      let product = await client.get(id); // Try to fetch the product from cache it exists
      if (product) {
        return JSON.parse(product);
      }
      product = await Product.findById(new mongoose.Types.ObjectId(id));
      if (!product) {
        throw new Error('Product not found');
      } else {
        product._doc = { href: req.originalUrl, ...product._doc };
        client.setEx(id, 600, JSON.stringify(product)); // Save the product in cache
        return product;
      }
    } else {
      throw new Error('Invalid product id');
    }
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
      const response = await Product.findByIdAndUpdate(id, input);
      await client.expireAt(id, 0); // Deletes product on cache
      input._id = id;
      if (response) {
        return input;
      }
      throw new Error(response.message);
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
      const response = await Product.findByIdAndDelete(id);
      await client.expireAt(id, 0); // Deletes product on cache
      if (response) {
        return response;
      }
      throw new Error('Product not found');
    } else {
      throw new Error('Invalid product id');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};
