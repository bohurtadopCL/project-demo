const express = require('express');
// const productRoutes = require('./products.routes');
// const shoppingCarRoutes = require('./shoppingCar.routes');
const entry_point_response = require('../../entry-point-response.json');
const { graphqlHTTP } = require('express-graphql');
const schema = require('../graphql/schema');

const apiRouter = express.Router();

// apiRouter.use('/products', productRoutes);
// apiRouter.use('/shoppingCars', shoppingCarRoutes);

apiRouter.get('/', (req, res) => {
  res.send(entry_point_response);
});

apiRouter.use(
  '/graphql',
  graphqlHTTP({
    graphiql: true,
    schema: schema,
  })
);

module.exports = apiRouter;
