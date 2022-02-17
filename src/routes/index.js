const express = require('express');
const productRoutes = require('./products.routes');
const shoppingCarRoutes = require('./shoppingCar.routes');
const entry_point_response = require('../../entry-point-response.json');

const apiRouter = express.Router();

apiRouter.use('/products', productRoutes);
apiRouter.use('/shoppingCars', shoppingCarRoutes);

apiRouter.get('/', (req, res) => {
    res.send(entry_point_response)
})

module.exports = apiRouter;
