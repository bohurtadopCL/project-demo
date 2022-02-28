const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const logger = require('@condor-labs/logger');
const client = require('../redis/redis');
const Product = require('../models/Product');
const ShoppingCar = require('../models/ShoppingCar');
const { shoppingCarCodeAlreadyExists } = require('../utils/utils');

// Lookup aggregate mongodb function to find all shopping cars
async function findShoppingCars(skip, limit) {
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
    {
      $skip: skip,
    },
    {
      $limit: limit,
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
exports.save = async function (req, input) {
  logger.log(req.originalUrl);
  try {
    if (await shoppingCarCodeAlreadyExists(input.code)) {
      throw new Error('Invalid shopping car code');
    } else {
      const newShoppingCar = new ShoppingCar(input);
      const item = await newShoppingCar.save();
      if (item) {
        return item;
      }
      throw new Error('Unable to create a new shopping car');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Returns all the shopping cars
exports.find = async function (req, offset, limit) {
  logger.log(req.originalUrl);
  try {
    const items = await findShoppingCars(offset || 0, limit || 25);
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
      let shoppingCar = await client.get(id); // Try to fetch the shopping car from cache if exists
      if (shoppingCar) {
        return JSON.parse(shoppingCar);
      }
      shoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(id));
      if (!shoppingCar.length) {
        throw new Error('Shopping car not found');
      } else {
        shoppingCar[0].href = req.originalUrl;
        await client.setEx(id, 600, JSON.stringify(shoppingCar[0])); // Save the shopping car on cache
        return shoppingCar[0];
      }
    } else {
      throw new Error('Invalid shopping car id');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Updates a shopping car
exports.update = async function (req, id, input) {
  logger.log(req.originalUrl);
  try {
    if (shoppingCarCodeAlreadyExists(input.code)) {
      throw new Error('Invalid shopping car code');
    } else {
      const response = ShoppingCar.findByIdAndUpdate(id, input);
      await client.expireAt(id, 0); // Deletes the shopping car from cache
      if (response) {
        return response;
      }
      throw new Error('Shopping car not found');
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
      const response = await ShoppingCar.findByIdAndDelete(id);
      await client.expireAt(id, 0); // Deletes the shopping car from cache
      if (response) {
        return response;
      }
      throw new Error('Shopping car not found');
    } else {
      throw new Error('Invalid shopping car id');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Add a given quantity of a product by shopping car's id and product's id
exports.addProduct = async function (req, id, pid, quantity) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(pid)) {
      const shoppingCar = await ShoppingCar.findById(id);
      let product = await Product.findById(pid);
      if (!shoppingCar) {
        throw new Error('Shopping car not found');
      } else if (!product) {
        throw new Error('Product not found');
      } else {
        const products = shoppingCar._doc.products;
        product = { ...product._doc, quantity: quantity || 1 };
        const found = await products.find((e) => (e._id.equals(product._id) ? (e.quantity += product.quantity) : null));
        if (!found) {
          products.push(product);
        }
        const response = await ShoppingCar.findByIdAndUpdate(id, {
          products: products,
        });
        await client.expireAt(id, 0); // Deletes the shopping car from cache
        if (response) {
          const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(id));
          return updatedShoppingCar[0];
        }
        throw new Error('Unable to update shopping car');
      }
    } else {
      throw new Error('Invalid object ids');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Deletes a given quantity of a product in a shopping car
exports.deleteProduct = async function (req, id, pid, quantity) {
  logger.log(req.originalUrl);
  try {
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(pid)) {
      const shoppingCar = await ShoppingCar.findById(id);
      let product = await Product.findById(pid);
      if (!shoppingCar) {
        throw new Error('Shopping car not found');
      } else if (!product) {
        throw new Error('Product not found');
      } else {
        const products = shoppingCar._doc.products;
        product = { ...product._doc, quantity: quantity };
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
        const response = await ShoppingCar.findByIdAndUpdate(id, {
          products: products,
        });
        await client.expireAt(id, 0); // Deletes the shopping car from cache
        if (response) {
          const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(id));
          return updatedShoppingCar[0];
        }
        throw new Error('/unable to update shopping car');
      }
    } else {
      throw new Error('Invalid object ids');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};
