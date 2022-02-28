const mongoose = require('mongoose');
const logger = require('@condor-labs/logger');
const redisClient = require('../src/redis/redis');
const config = require('config');
const Product = require('../src/models/Product');
const ShoppingCar = require('../src/models/ShoppingCar');
const productsRepository = require('../src/repositories/products.repository');
const shoppingCarsRepository = require('../src/repositories/shoppingCars.repository');

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

const exampleReq = {
  originalUrl: 'test://api/v1/test',
  baseUrl: 'test://api/v1',
};

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
    const res = await productsRepository.save(exampleReq, myProduct);
    expect(res).toMatchObject(myProduct);
  });

  test('Should fetch product created from database', async () => {
    // Get product id
    const { _id } = await Product.findOne(myProduct);
    productId = _id;
    // Fetch product with id
    const res = await productsRepository.findById(exampleReq, productId);
    expect(res).toMatchObject(myProduct);
  });

  test('Should create a product 2', async () => {
    const res = await productsRepository.save(exampleReq, myProduct2);
    expect(res).toMatchObject(myProduct2);
  });

  test('Should fetch product 2 created from database', async () => {
    // Get product id
    const { _id } = await Product.findOne(myProduct2);
    productId2 = _id;
    // Fetch product with id
    const res = await productsRepository.findById(exampleReq, productId2);
    expect(res).toMatchObject(myProduct2);
  });

  test('Should create a shopping car', async () => {
    const res = await shoppingCarsRepository.save(exampleReq, myShoppingCar);
    expect(res).toMatchObject(myShoppingCar);
  });

  test('Should fetch shopping car created from database', async () => {
    // Get shopping car id
    const { _id } = await ShoppingCar.findOne(myShoppingCar);
    shoppingCarId = _id;
    // Fetch shopping car with id
    const res = await shoppingCarsRepository.findById(exampleReq, shoppingCarId);
    expect(res).toMatchObject(myShoppingCar);
  });

  test('Should add the product to the shopping car', async () => {
    const res = await shoppingCarsRepository.addProduct(exampleReq, shoppingCarId, productId);
    expect(res).toMatchObject({ products: [myProduct], ...myShoppingCar });
  });

  test('Should add the product 2 to the shopping car', async () => {
    const res = await shoppingCarsRepository.addProduct(exampleReq, shoppingCarId, productId2);
    expect(res).toMatchObject({ products: [myProduct, myProduct2], ...myShoppingCar });
  });

  test('Should fetch the shopping car with the added product', async () => {
    const res = await shoppingCarsRepository.findById(exampleReq, shoppingCarId);
    expect(res).toMatchObject(myShoppingCar);
    expect(res.products).toEqual(expect.arrayContaining([expect.objectContaining(myProduct)]));
  });

  test('Should delete product from shopping car', async () => {
    const res = await shoppingCarsRepository.deleteProduct(exampleReq, shoppingCarId, productId2);
    expect(res).toMatchObject(myShoppingCar);
  });

  test("Shouldn't fetch the shopping car with the product just deleted", async () => {
    const res = await shoppingCarsRepository.findById(exampleReq, shoppingCarId);
    expect(res.products).toEqual(expect.not.arrayContaining([expect.objectContaining(myProduct2)]));
  });

  test('Should delete the product from database', async () => {
    const res = await productsRepository.delete(exampleReq, productId);
    expect(res).toMatchObject(myProduct);
  });

  test("Shouldn't fetch product from database", async () => {
    try {
      const res = await productsRepository.findById(exampleReq, productId);
      expect(res).toBe(null);
    } catch (error) {
      expect(error.message).toBe('Product not found');
    }
  });

  test('Should delete the shopping car from database', async () => {
    const res = await shoppingCarsRepository.delete(exampleReq, shoppingCarId);
    expect(res).toMatchObject(myShoppingCar);
  });

  test("Shouldn't fetch shopping car from database", async () => {
    try {
      const res = await shoppingCarsRepository.findById(exampleReq, shoppingCarId);
      expect(res).toBe(null);
    } catch (error) {
      expect(error.message).toBe('Shopping car not found');
    }
  });
});
