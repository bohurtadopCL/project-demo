const express = require('express');
const repository = require('../repositories/products.repository');

const productsRoutes = express.Router();

productsRoutes.get('/', repository.find);
productsRoutes.post('/', repository.save);
productsRoutes.get('/:_id', repository.findById);
productsRoutes.put('/:_id', repository.update);
productsRoutes.delete('/:_id', repository.delete);

module.exports = productsRoutes;
