const express = require('express');
const controller = require('../contollers/products.controller');

const productsRoutes = express.Router();

productsRoutes.get('/', controller.find);
productsRoutes.post('/', controller.save);
productsRoutes.get('/:_id', controller.findById);
productsRoutes.put('/:_id', controller.update);
productsRoutes.delete('/:_id', controller.delete);

module.exports = productsRoutes;
