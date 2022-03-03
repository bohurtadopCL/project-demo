const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const Product = require('../models/Product');
const cacheController = require('../cache/cache.controller');

// Saves product in database
exports.save = async function (input) {
  try {
    const newProduct = new Product(input);
    const response = await newProduct.save();
    if (!response) {
      throw new Error('Unable to create product');
    }
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch products from database
exports.find = async function (offset, limit) {
  try {
    const products = await Product.find().skip(offset).limit(limit);
    if (!products.length) {
      throw new Error('Cannot find products');
    }
    return products;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch a product from database by id
exports.findById = async function (id) {
  try {
    let product = await cacheController.get(id); // Try to fetch the product from cache it exists
    if (product) {
      return JSON.parse(product);
    }
    product = await Product.findById(new mongoose.Types.ObjectId(id));
    if (!product) {
      throw new Error('Product not found');
    }
    await cacheController.save(id, 600, JSON.stringify(product)); // Save the product in cache
    return product;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Updates a product in database by id
exports.findByIdAndUpdate = async function (id, input) {
  try {
    const response = await Product.findByIdAndUpdate(id, input);
    if (!response) {
      throw new Error('Product not found');
    }
    await cacheController.expire(id, 0); // Deletes product on cache
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Deletes a product in database by id
exports.findByIdAndDelete = async function (id) {
  try {
    const response = await Product.findByIdAndDelete(id);
    if (response) {
      throw new Error('Product not found');
    }
    await cacheController.expire(id, 0); // Deletes product on cache
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};
