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
      res.status(400).send('Invalid product code');
    } else if (!isAValidCategory(req)) {
      res.status(400).send('Invalid category');
    } else {
      const newProduct = new Product(req.body);
      newProduct
        .save()
        .then((r) => {
          res.setHeader('Location', req.baseUrl.concat('/', r._id));
          res.status(201).send();
        })
        .catch((err) => {
          res.status(400).send(err.message);
          logger.log(err.message);
        });
      // Deletes products on cache
      await client.expireAt('products', 0);
    }
  } catch (err) {
    logger.log(err.message);
    res.status(500).send();
  }
};

// Returns all the products
exports.find = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    // Looking for products in cache
    const products = await client.get('products');
    if (products) {
      res.send(JSON.parse(products));
    } else {
      Product.find()
        .then((items) => {
          for (const item of items) {
            item._doc = { href: req.baseUrl.concat('/', item._doc._id), ...item._doc };
          }
          client.setEx('products', 600, JSON.stringify(items));
          res.send(items);
        })
        .catch((err) => {
          res.send(err.message);
          logger.log(err.message);
        });
    }
  } catch (err) {
    logger.log(err.message);
    res.status(500).send();
  }
};

// Returns a product by an id provided
exports.findById = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      const product = await Product.findById(req.params);
      if (!product) {
        res.status(404).send('Product not found');
      } else {
        product._doc = { href: req.originalUrl, ...product._doc };
        res.send(product);
      }
    } else {
      res.status(400).send('Invalid product id');
    }
  } catch (err) {
    logger.log(err.message);
    res.status(500).send();
  }
};

// Updates a product
exports.update = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (await codeAlreadyExists(req)) {
      res.status(400).send('Invalid product code');
    } else if (!isAValidCategory(req)) {
      res.status(400).send('Invalid category');
    } else {
      Product.findByIdAndUpdate(req.params, req.body)
        .then(() => res.send())
        .catch((err) => {
          res.status(400).send(err.message);
          logger.log(err.message);
        });
      // Deletes products on cache
      await client.expireAt('products', 0);
    }
  } catch (err) {
    logger.log(err.message);
    res.status(500).send();
  }
};

// Deletes a product on database
exports.delete = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      Product.findByIdAndDelete(req.params)
        .then(() => {
          res.send();
        })
        .catch((err) => {
          res.status(500).send(err.message);
        });
      // Deletes products on cache
      await client.expireAt('products', 0);
    } else {
      res.status(400).send('Invalid product id');
    }
  } catch (err) {
    logger.log(err.message);
    res.status(500).send();
  }
};
