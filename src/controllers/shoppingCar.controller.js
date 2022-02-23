const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const client = require('../redis/redis');
const Product = require('../models/Product');
const ShoppingCar = require('../models/ShoppingCar');
const { sendSignalToProcessName } = require('pm2');

// Looks if shopping car code already exists on database
async function codeAlreadyExists(req) {
  const shoppingCarCode = req.body.code || null;
  const oldShoppingCar = shoppingCarCode
    ? await ShoppingCar.findOne({
        code: shoppingCarCode,
      })
    : true;
  return oldShoppingCar ? true : false;
}

// Returns an error to restful or graphql methods
function sendError(message, res, statusCode) {
  if (res) {
    res.status(statusCode).send({ message: message });
  } else {
    throw new Error(message);
  }
}

// Lookup aggregate mongodb function to find all shopping cars
async function findShoppingCars() {
  return await ShoppingCar.aggregate([
    {
      $lookup: {
        from: 'products',
        let: {
          p: '$products',
        },
        pipeline: [
          {
            $match: { $expr: { $in: ['$_id', '$$p._id'] } },
          },
          {
            $project: {
              _id: '$_id',
              code: '$code',
              name: '$name',
              price: '$price',
              category: '$category',
              quantity: {
                $let: {
                  vars: {
                    index: { $indexOfArray: ['$$p._id', '$_id'] },
                  },
                  in: {
                    $let: {
                      vars: {
                        prod: { $arrayElemAt: ['$$p', '$$index'] },
                      },
                      in: '$$prod.quantity',
                    },
                  },
                },
              },
            },
          },
        ],
        as: 'products',
      },
    },
    {
      $set: {
        totalPrice: {
          $sum: {
            $map: {
              input: '$products',
              as: 'product',
              in: { $multiply: ['$$product.price', '$$product.quantity'] },
            },
          },
        },
      },
    },
  ]);
}

// Lookup aggregate mongodb function to find a shoppping car by id
async function findShoppingCarById(id) {
  return await ShoppingCar.aggregate([
    {
      $match: { $expr: { $eq: ['$_id', id] } },
    },
    {
      $lookup: {
        from: 'products',
        let: {
          p: '$products',
        },
        pipeline: [
          {
            $match: { $expr: { $in: ['$_id', '$$p._id'] } },
          },
          {
            $project: {
              _id: '$_id',
              code: '$code',
              name: '$name',
              price: '$price',
              category: '$category',
              quantity: {
                $let: {
                  vars: {
                    index: { $indexOfArray: ['$$p._id', '$_id'] },
                  },
                  in: {
                    $let: {
                      vars: {
                        prod: { $arrayElemAt: ['$$p', '$$index'] },
                      },
                      in: '$$prod.quantity',
                    },
                  },
                },
              },
            },
          },
        ],
        as: 'products',
      },
    },
    {
      $set: {
        totalPrice: {
          $sum: {
            $map: {
              input: '$products',
              as: 'product',
              in: { $multiply: ['$$product.price', '$$product.quantity'] },
            },
          },
        },
      },
    },
  ]);
}

// Create a new shopping car
exports.save = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (await codeAlreadyExists(req)) {
      res.status(400).send('Invalid shopping car code');
    } else {
      const newShoppingCar = new ShoppingCar(req.body);
      newShoppingCar
        .save()
        .then((r) => {
          res.setHeader('Location', req.baseUrl.concat('/', r._id));
          res.status(201).send();
        })
        .catch((err) => {
          res.status(400).send(err.message);
          logger.log(err.message);
        });
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Returns all the shopping cars
exports.find = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    const items = await findShoppingCars();
    if (items) {
      for (const i of items) {
        i.href = req.baseUrl.concat('/', i._id);
      }
      if (res) {
        res.send(items.slice(req.params.offset || 0, req.params.limit || 25));
      } else {
        return items.slice(req.params.offset || 0, req.params.limit || 25);
      }
    } else {
      sendError('Unable to find shopping cars', res, 500);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Returns a shopping car by an id provided
exports.findById = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      const id = new mongoose.Types.ObjectId(req.params._id);
      let shoppingCar = await client.get(id); // Try to fetch the shopping car from cache if exists
      if (shoppingCar) {
        if (res) {
          res.send(JSON.parse(shoppingCar));
        } else {
          return JSON.parse(shoppingCar);
        }
      } else {
        shoppingCar = await findShoppingCarById(id);
        if (!shoppingCar.length) {
          sendError('Shopping car not found', res, 404);
        } else {
          shoppingCar[0].href = req.originalUrl;
          await client.setEx(id, 600, JSON.stringify(shoppingCar[0])); // Save the shopping car on cache
          return res ? res.send(shoppingCar[0]) : shoppingCar[0];
        }
      }
    } else {
      sendError('Invalid shopping car id', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Updates a shopping car
exports.update = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (codeAlreadyExists(req)) {
      res.status(400).send('Invalid shopping car code');
    } else {
      const response = ShoppingCar.findByIdAndUpdate(req.params, req.body);
      await client.expireAt(req.params._id, 0); // Deletes the shopping car from cache
      if (response) {
        if (res) {
          res.send(response);
        } else {
          return response;
        }
      } else {
        sendError('Internal server error', res, 500);
      }
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Deletes a shopping car by an id provided
exports.delete = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
      const response = await ShoppingCar.findByIdAndDelete(req.params);
      await client.expireAt(req.params._id, 0); // Deletes the shopping car from cache
      if (response) {
        if (res) {
          res.send(response);
        } else {
          return response;
        }
      } else {
        sendError('Internal server error', res, 500);
      }
    } else {
      sendError('Invalid shopping car id', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Add a given quantity of a product by shopping car's id and product's id
exports.addProduct = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id) && mongoose.Types.ObjectId.isValid(req.params._pid)) {
      const shoppingCar = await ShoppingCar.findById(req.params._id);
      let product = await Product.findById(req.params._pid);
      if (!shoppingCar) {
        sendError('Shopping car not found', res, 400);
      } else if (!product) {
        sendError('Product not found', res, 400);
      } else {
        const products = shoppingCar._doc.products;
        product = { ...product._doc, quantity: req.body.quantity || 1 };
        const found = await products.find((e) => (e._id.equals(product._id) ? (e.quantity += product.quantity) : null));
        if (!found) {
          products.push(product);
        }
        const response = await ShoppingCar.findByIdAndUpdate(req.params, {
          products: products,
        });
        await client.expireAt(req.params._id, 0); // Deletes the shopping car from cache
        if (response) {
          const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(req.params._id));
          if (res) {
            res.send(updatedShoppingCar[0]);
          } else {
            return updatedShoppingCar[0];
          }
        } else {
          sendError('Internal server error', res, 500);
        }
      }
    } else {
      sendError('Invalid object ids', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};

// Deletes a given quantity of a product in a shopping car
exports.deleteProduct = async function (req, res) {
  logger.log(req.method, req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(req.params._id) && mongoose.Types.ObjectId.isValid(req.params._pid)) {
      const shoppingCar = await ShoppingCar.findById(req.params._id);
      let product = await Product.findById(req.params._pid);
      if (!shoppingCar) {
        sendError('Shopping car not found', res, 400);
      } else if (!product) {
        sendError('Product not found', res, 400);
      } else {
        const products = shoppingCar._doc.products;
        product = { ...product._doc, quantity: req.body.quantity };
        await products.forEach((e, i) => {
          if (e._id.equals(product._id)) {
            if (product.quantity) {
              if (e.quantity > product.quantity) {
                e.quantity -= product.quantity;
              } else {
                products.splice(i, 1);
              }
            } else {
              products.splice(i, 1);
            }
          }
        });
        const response = await ShoppingCar.findByIdAndUpdate(req.params, {
          products: products,
        });
        await client.expireAt(req.params._id, 0); // Deletes the shopping car from cache
        if (response) {
          const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(req.params._id));
          if (res) {
            res.send(updatedShoppingCar[0]);
          } else {
            return updatedShoppingCar[0];
          }
        } else {
          sendError('Internal server error', res, 500);
        }
      }
    } else {
      sendSignalToProcessName('Invalid object ids', res, 400);
    }
  } catch (err) {
    sendError(err.message, res, 500);
  }
};
