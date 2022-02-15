const express = require('express');
const productRoutes = require('./products.routes');

const apiRouter = express.Router();

apiRouter.use('/products', productRoutes);

module.exports = apiRouter;
