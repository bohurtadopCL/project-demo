const express = require('express');
const controller = require('../controllers/shoppingCar.controller');

const shoppingCarsRoutes = express.Router();

shoppingCarsRoutes.get('/', controller.find);
shoppingCarsRoutes.post('/', controller.save);
shoppingCarsRoutes.get('/:_id', controller.findById);
shoppingCarsRoutes.put('/:_id', controller.update);
shoppingCarsRoutes.delete('/:_id', controller.delete);
shoppingCarsRoutes.post('/:_id/products/:_pid', controller.addProduct);
shoppingCarsRoutes.delete('/:_id/products/:_pid', controller.deleteProduct);

module.exports = shoppingCarsRoutes;
