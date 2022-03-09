const productRepository = require('../src/repositories/product.repository');
const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const cacheController = require('../src/cache/cache.controller');
const Product = require('../src/models/Product');

jest.mock('../src/cache/cache.controller');
jest.mock('../src/models/Product');

const myProduct = {
  code: 'Test product code',
  name: 'Test product name',
  price: 10000,
  category: 'FOOD',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Product repository', () => {
  describe('Create a new product', () => {
    it('Should create a new product', async () => {
      // Arrange
      const newProduct = new Product(myProduct);
      newProduct.save.mockResolvedValueOnce(myProduct);

      // Act
      await productRepository.save(myProduct);

      // Asserts
      expect(newProduct.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find product by id', () => {
    it('Should find a product by id', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      Product.findById.mockResolvedValueOnce(myProduct);
      cacheController.get.mockResolvedValueOnce(null);
      cacheController.save.mockResolvedValueOnce(true);

      // Act
      await productRepository.findById(productId);

      // Asserts
      expect(Product.findById).toHaveBeenCalledWith(productId);
      expect(Product.findById).toHaveBeenCalledTimes(1);
      expect(cacheController.get).toHaveBeenCalledWith(productId);
      expect(cacheController.get).toHaveBeenCalledTimes(1);
      expect(cacheController.save).toHaveBeenCalledWith(productId, 600, JSON.stringify(myProduct));
      expect(cacheController.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find product by id with cache', () => {
    it('Should find a product by id with cache', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      cacheController.get.mockResolvedValueOnce(JSON.stringify(myProduct));

      // Act
      await productRepository.findById(productId);

      // Asserts
      expect(cacheController.get).toHaveBeenCalledWith(productId);
      expect(cacheController.get).toHaveBeenCalledTimes(1);
      expect(Product.findById).not.toHaveBeenCalled();
      expect(cacheController.save).not.toHaveBeenCalled();
    });
  });

  describe('Update a product by id', () => {
    it('Should update a product by id', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      Product.findByIdAndUpdate.mockResolvedValueOnce(myProduct);
      cacheController.expire.mockResolvedValueOnce(true);

      // Act
      await productRepository.findByIdAndUpdate(productId, myProduct);

      // Asserts
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, myProduct);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(cacheController.expire).toHaveBeenCalledWith(productId, 0);
      expect(cacheController.expire).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete a product by id', () => {
    it('Should delete a product by id', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      Product.findByIdAndDelete.mockResolvedValueOnce(myProduct);
      cacheController.expire.mockResolvedValueOnce(true);

      // Act
      await productRepository.findByIdAndDelete(productId);

      // Asserts
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(productId);
      expect(Product.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(cacheController.expire).toHaveBeenCalledWith(productId, 0);
      expect(cacheController.expire).toHaveBeenCalledTimes(1);
    });
  });
});
