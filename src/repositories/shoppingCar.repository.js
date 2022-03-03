const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const ShoppingCar = require('../models/ShoppingCar');
const Product = require('../models/Product');
const cacheController = require('../cache/cache.controller');

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

// Saves shopping car in database
exports.save = async function (input) {
  try {
    const newShoppingCar = new ShoppingCar(input);
    const response = await newShoppingCar.save();
    if (!response) {
      throw new Error('Unable to create shopping car');
    }
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch shpping cars from database
exports.find = async function (skip, limit) {
  try {
    const shoppingCars = await findShoppingCars(skip, limit);
    if (!shoppingCars.length) {
      throw new Error('Cannot find shopping cars');
    }
    return shoppingCars;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch a shopping car from database by id
exports.findById = async function (id) {
  try {
    let shoppingCar = await cacheController.get(id); // Try to fetch the shopping car from cache if exists
    if (shoppingCar) {
      return JSON.parse(shoppingCar);
    }
    shoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(id));
    if (!shoppingCar.length) {
      throw new Error('Shopping car not found');
    }
    await cacheController.save(id, 600, JSON.stringify(shoppingCar[0])); // Save the shopping car on cache
    return shoppingCar[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

// Updates a shopping car in database by id
exports.findByIdAndUpdate = async function (id, input) {
  try {
    const response = await ShoppingCar.findByIdAndUpdate(id, input);
    if (!response) {
      throw new Error('Product not found');
    }
    await cacheController.expire(id, 0); // Deletes the shopping car from cache
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Deletes a product in database by id
exports.findByIdAndDelete = async function (id) {
  try {
    const response = await ShoppingCar.findByIdAndDelete(id);
    if (response) {
      throw new Error('Product not found');
    }
    await cacheController.expire(id, 0); // Deletes the shopping car from cache
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Add a product to a shopping car
exports.addProductToShoppingCar = async function (productId, shoppingCarId, quantity) {
  try {
    const shoppingCar = await ShoppingCar.findById(shoppingCarId);
    let product = await Product.findById(productId);
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
      const response = await ShoppingCar.findByIdAndUpdate(shoppingCarId, {
        products: products,
      });
      if (response) {
        const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(shoppingCarId));
        await cacheController.expire(shoppingCarId, 0); // Deletes the shopping car from cache
        return updatedShoppingCar[0];
      }
      throw new Error('Unable to update shopping car');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete a product from shopping car
exports.deleteProductFromShoppingCar = async function (productId, shoppingCarId, quantity) {
  try {
    const shoppingCar = await ShoppingCar.findById(shoppingCarId);
    let product = await Product.findById(productId);
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
      const response = await ShoppingCar.findByIdAndUpdate(shoppingCarId, {
        products: products,
      });
      if (response) {
        const updatedShoppingCar = await findShoppingCarById(new mongoose.Types.ObjectId(shoppingCarId));
        await cacheController.expire(shoppingCarId, 0); // Deletes the shopping car from cache
        return updatedShoppingCar[0];
      }
      throw new Error('/unable to update shopping car');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
