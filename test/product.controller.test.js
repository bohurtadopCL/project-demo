const productController = require('../src/controllers/product.controller');
const productRepository = require('../src/repositories/product.repository');
const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const { isAValidCategory, isAValidPrice, productCodeAlreadyExists } = require('../src/utils/utils');

jest.mock('../src/repositories/product.repository');
jest.mock('../src/utils/utils');

beforeEach(() => {
  jest.clearAllMocks();
});

const myProduct = {
  code: 'Test product code',
  name: 'Test product name',
  price: 10000,
  category: 'FOOD',
};

const exampleReq = {
  originalUrl: 'test://api/v1/test',
  baseUrl: 'test://api/v1',
};

describe('Product controller', () => {
  describe('Create new product', () => {
    it('Should create a new product', async () => {
      // Arrange
      productRepository.save.mockResolvedValueOnce(myProduct);
      productCodeAlreadyExists.mockResolvedValueOnce(false);
      isAValidCategory.mockReturnValueOnce(true);
      isAValidPrice.mockReturnValueOnce(true);

      // Act
      await productController.save(exampleReq, myProduct);

      // Asserts
      expect(productRepository.save).toHaveBeenCalledWith(myProduct);
      expect(productRepository.save).toHaveBeenCalledTimes(1);
      expect(productCodeAlreadyExists).toHaveBeenCalledWith(myProduct.code);
      expect(productCodeAlreadyExists).toHaveBeenCalledTimes(1);
      expect(isAValidCategory).toHaveBeenCalledWith(myProduct.category);
      expect(isAValidCategory).toHaveBeenCalledTimes(1);
      expect(isAValidPrice).toHaveBeenCalledWith(myProduct.price);
      expect(isAValidPrice).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find product by id', () => {
    it('Should find a product by id', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      productRepository.findById.mockResolvedValueOnce(myProduct);

      // Act
      await productController.findById(exampleReq, productId);

      // Asserts
      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Update product by id', () => {
    it('Should update a product', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      productRepository.findByIdAndUpdate.mockResolvedValueOnce(myProduct);
      productCodeAlreadyExists.mockResolvedValueOnce(false);
      isAValidCategory.mockReturnValueOnce(true);
      isAValidPrice.mockReturnValueOnce(true);

      // Act
      await productController.update(exampleReq, productId, myProduct);

      // Asserts
      expect(productRepository.findByIdAndUpdate).toHaveBeenCalledWith(productId, myProduct);
      expect(productRepository.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(productCodeAlreadyExists).toHaveBeenCalledWith(myProduct.code);
      expect(productCodeAlreadyExists).toHaveBeenCalledTimes(1);
      expect(isAValidCategory).toHaveBeenCalledWith(myProduct.category);
      expect(isAValidCategory).toHaveBeenCalledTimes(1);
      expect(isAValidPrice).toHaveBeenCalledWith(myProduct.price);
      expect(isAValidPrice).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete product by id', () => {
    it('Should delete a product', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      productRepository.findByIdAndDelete.mockResolvedValueOnce(myProduct);

      // Act
      await productController.delete(exampleReq, productId);

      // Asserts
      expect(productRepository.findByIdAndDelete).toHaveBeenCalledWith(productId);
      expect(productRepository.findByIdAndDelete).toHaveBeenCalledTimes(1);
    });
  });
});
