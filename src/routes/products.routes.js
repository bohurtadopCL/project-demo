const express = require('express');
const controller = require('../controllers/products.controller');
const Product = require('../models/Product');

const productsRoutes = express.Router();

productsRoutes.get('/', controller.find);
productsRoutes.post('/', controller.save);
productsRoutes.get('/:_id', controller.findById);
productsRoutes.put('/:_id', controller.update);

module.exports = productsRoutes;