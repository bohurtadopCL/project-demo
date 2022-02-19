const mongoose = require('mongoose');
const request = require('supertest');
const logger = require('@condor-labs/logger');
const redisClient = require('../src/redis/redis');
const config = require('config');
const app = require('../src/index');
const Product = require('../src/models/Product');
const ShoppingCar = require('../src/models/ShoppingCar');

const myProduct = {
  code: 'Test product code',
  name: 'Test product name',
  price: 10000,
  category: 'FOOD',
};

const myProduct2 = {
  code: 'Test product code 2',
  name: 'Test product name 2',
  price: 20000,
  category: 'TECH',
};

const myShoppingCar = {
  code: 'Test shopping car code',
};

const db = config.get('mongoURI');

beforeAll(async () => {
  await mongoose
    .connect(db, { useNewUrlParser: true })
    .then(() => logger.log('MongoDB Connected...'))
    .catch((err) => logger.log(err));
  await Product.findOneAndDelete(myProduct);
  await Product.findOneAndDelete(myProduct2);
  await ShoppingCar.findOneAndDelete(myShoppingCar);
});

afterAll(async () => {
  await Product.findOneAndDelete(myProduct);
  await Product.findOneAndDelete(myProduct2);
  await ShoppingCar.findOneAndDelete(myShoppingCar);
  mongoose.connection.close();
  redisClient.disconnect();
});

describe('It should create two products, create a shopping car, add the products to the shopping car, delete product from shopping car, delete product from database and delete shopping car', () => {
  let productId, shoppingCarId, productId2;

  test('Should create a product', async () => {
    const res = await request(app).post('/api/v1/products').send(myProduct);
    expect(res.statusCode).toEqual(201);
  });

  test('Should fetch product created from database', async () => {
    // Get product id
    const { _id } = await Product.findOne(myProduct);
    productId = _id;
    // Fetch product with id
    const res = await request(app).get('/api/v1/products/'.concat(productId));
    expect(res.body).toMatchObject(myProduct);
  });

  test('Should create a product 2', async () => {
    const res = await request(app).post('/api/v1/products').send(myProduct2);
    expect(res.statusCode).toEqual(201);
  });

  test('Should fetch product 2 created from database', async () => {
    // Get product id
    const { _id } = await Product.findOne(myProduct2);
    productId2 = _id;
    // Fetch product with id
    const res = await request(app).get('/api/v1/products/'.concat(productId2));
    expect(res.body).toMatchObject(myProduct2);
  });

  test('Should create a shopping car', async () => {
    const res = await request(app).post('/api/v1/shoppingCars').send(myShoppingCar);
    expect(res.statusCode).toEqual(201);
  });

  test('Should fetch shopping car created from database', async () => {
    // Get shopping car id
    const { _id } = await ShoppingCar.findOne(myShoppingCar);
    shoppingCarId = _id;
    // Fetch shopping car with id
    const res = await request(app).get('/api/v1/shoppingCars/'.concat(shoppingCarId));
    expect(res.body).toMatchObject(myShoppingCar);
  });

  test('Should add the product to the shopping car', async () => {
    const res = await request(app).post('/api/v1/shoppingCars/'.concat(shoppingCarId, '/products/', productId));
    expect(res.statusCode).toEqual(200);
  });

  test('Should add the product 2 to the shopping car', async () => {
    const res = await request(app).post('/api/v1/shoppingCars/'.concat(shoppingCarId, '/products/', productId2));
    expect(res.statusCode).toEqual(200);
  });

  test('Should fetch the shopping car with the added product', async () => {
    const res = await request(app).get('/api/v1/shoppingCars/'.concat(shoppingCarId));
    expect(res.body).toMatchObject(myShoppingCar);
    expect(res.body.products).toEqual(expect.arrayContaining([expect.objectContaining(myProduct)]));
  });

  test('Should delete product from shopping car', async () => {
    const res = await request(app).delete('/api/v1/shoppingCars/'.concat(shoppingCarId, '/products/', productId));
    expect(res.statusCode).toEqual(200);
  });

  test("Shouldn't fetch the shopping car with the product just deleted", async () => {
    const res = await request(app).get('/api/v1/shoppingCars/'.concat(shoppingCarId));
    expect(res.body.products).toEqual(expect.not.arrayContaining([expect.objectContaining(myProduct)]));
  });

  test('Should delete the product from database', async () => {
    const res = await request(app).delete('/api/v1/products/'.concat(productId));
    expect(res.statusCode).toEqual(200);
  });

  test("Shouldn't fetch product from database", async () => {
    const res = await request(app).get('/api/v1/products/'.concat(productId));
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(expect.not.objectContaining(myProduct));
  });

  test('Should delete the shopping car from database', async () => {
    const res = await request(app).delete('/api/v1/shoppingCars/'.concat(shoppingCarId));
    expect(res.statusCode).toEqual(200);
  });

  test("Shouldn't fetch shopping car from database", async () => {
    const res = await request(app).get('/api/v1/shoppingCars/'.concat(shoppingCarId));
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(expect.not.objectContaining(myShoppingCar));
  });
});
