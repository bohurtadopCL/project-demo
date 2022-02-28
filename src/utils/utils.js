const Product = require('../models/Product');
const ShoppingCar = require('../models/ShoppingCar');
const Categories = require('../enums/categories');

// Looks if category name is provided and then compares with valid categories
exports.isAValidCategory = function (category) {
  return category ? Categories.includes(category) : false;
};

// Validate if price is a non-negative value
exports.isAValidPrice = function (price) {
  return price > 0 ? true : false;
};

// Looks if product code already exists on database
exports.productCodeAlreadyExists = async function (code) {
  const oldProduct = await Product.findOne({
    code: code,
  });
  return oldProduct ? true : false;
};

// Looks if shopping car code already exists on database
exports.shoppingCarCodeAlreadyExists = async function (code) {
  const oldShoppingCar = await ShoppingCar.findOne({
    code: code,
  });
  return oldShoppingCar ? true : false;
};
