const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const client = require('../redis/redis');
const Product = require('../models/Product');
const Categories = require('../enums/categories');

// Looks if category name is provided and then compares with valid categories
function isAValidCategory(req) {
  const categoryName = req.body.category ? req.body.category : null;
  return categoryName ? Categories.includes(categoryName) : false;
}

function isAValidPrice(req) {
  const price = req.body.price ? req.body.price : null;
  return price ? (price > 0 ? true : false) : false;
}

// Returns an error to restful or graphql methods
function sendError(message, res, statusCode) {
  if (res) {
    res.status(statusCode).send({ message: message });
  } else {
    throw new Error(message);
  }
}

// Looks if product code already exists on database
async function codeAlreadyExists(req) {
  const productCode = req.body.code ? req.body.code : null;
  const oldProduct = productCode
    ? await Product.findOne({
        code: productCode,
      })
    : true;
  return oldProduct ? true : false;
}

// Create a new product
exports.save = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (await codeAlreadyExists(req)) {
      sendError('Invalid product code', res, 400);
    } else if (!isAValidCategory(req)) {
      sendError('Invalid category', res, 400);
    } else if (!isAValidPrice(req)) {
      sendError('Invalid price', res, 400);
    } else {
      const newProduct = new Product(req.body);
      const item = await newProduct.save();
      if (item) {
        if (res) {
          res.setHeader('Location', req.baseUrl.concat('/', item._id));
          res.status(201).send(item);
        } else {
          return item;
        }
      } else {
        sendError('Error saving product', res, 500);
      }
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Returns all the products
exports.find = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    const products = await Product.find();
    if (products) {
      for (const item of products) {
        item._doc = { href: req.baseUrl.concat('/', item._doc._id), ...item._doc };
      }
      if (res) {
        res.send(products);
      } else {
        return products;
      }
    } else {
      sendError('Internal server error', res, 500);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Returns a product by an id provided
exports.findById = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      let product = await client.get(req.params._id); // Try to fetch the product from cache it exists
      if (product) {
        if (res) {
          res.send(JSON.parse(product));
        } else {
          return JSON.parse(product);
        }
      } else {
        product = await Product.findById(req.params);
        if (!product) {
          sendError('Product not found', res, 404);
        } else {
          product._doc = { href: req.originalUrl, ...product._doc };
          client.setEx(product._doc._id, 600, JSON.stringify(product)); // Save the product in cache
          return res ? res.send(product) : product;
        }
      }
    } else {
      sendError('Invalid product id', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Updates a product
exports.update = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (req.body.code && (await codeAlreadyExists(req))) {
      sendError('Invalid product code', res, 400);
    } else if (!isAValidCategory(req)) {
      sendError('Invalid category', res, 400);
    } else if (!isAValidPrice(req)) {
      sendError('Invalid price', res, 400);
    } else {
      const response = await Product.findByIdAndUpdate(req.params, req.body);
      await client.expireAt(req.params._id, 0); // Deletes product on cache
      req.body._id = req.params._id;
      return response ? (res ? res.send(req.body) : req.body) : sendError(response.message, res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Deletes a product on database
exports.delete = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      const response = await Product.findByIdAndDelete(req.params);
      await client.expireAt(req.params._id, 0); // Deletes product on cache
      if (response) {
        if (res) {
          res.send(response);
        } else {
          return response;
        }
      } else {
        sendError('Product not found', res, 404);
      }
    } else {
      sendError('Invalid product id', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};
