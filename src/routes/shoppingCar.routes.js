const express = require('express');
const repository = require('../repositories/shoppingCars.repository');

const shoppingCarsRoutes = express.Router();

shoppingCarsRoutes.get('/', repository.find);
shoppingCarsRoutes.post('/', repository.save);
shoppingCarsRoutes.get('/:_id', repository.findById);
shoppingCarsRoutes.put('/:_id', repository.update);
shoppingCarsRoutes.delete('/:_id', repository.delete);
shoppingCarsRoutes.post('/:_id/products/:_pid', repository.addProduct);
shoppingCarsRoutes.delete('/:_id/products/:_pid', repository.deleteProduct);

module.exports = shoppingCarsRoutes;
