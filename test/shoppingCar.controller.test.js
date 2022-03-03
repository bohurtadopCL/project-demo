const shoppingCarController = require('../src/controllers/shoppingCar.controller');
const shoppingCarRepository = require('../src/repositories/shoppingCar.repository');
const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const { shoppingCarCodeAlreadyExists } = require('../src/utils/utils');

jest.mock('../src/repositories/shoppingCar.repository');
jest.mock('../src/utils/utils');

beforeEach(() => {
  jest.clearAllMocks();
});

const myShoppingCar = {
  code: 'Test shopping car code',
};

const exampleReq = {
  originalUrl: 'test://api/v1/test',
  baseUrl: 'test://api/v1',
};

describe('Shopping car controller', () => {
  describe('Create new shopping car', () => {
    it('Should create a new shopping car', async () => {
      // Arrange
      shoppingCarRepository.save.mockResolvedValueOnce(myShoppingCar);
      shoppingCarCodeAlreadyExists.mockResolvedValueOnce(false);

      // Act
      await shoppingCarController.save(exampleReq, myShoppingCar);

      // Asserts
      expect(shoppingCarRepository.save).toHaveBeenCalledWith(myShoppingCar);
      expect(shoppingCarRepository.save).toHaveBeenCalledTimes(1);
      expect(shoppingCarCodeAlreadyExists).toHaveBeenCalledWith(myShoppingCar.code);
      expect(shoppingCarCodeAlreadyExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find shopping car by id', () => {
    it('Should find a shopping car by id', async () => {
      // Arrange
      const shoppingCarId = new mongoose.Types.ObjectId();
      shoppingCarRepository.findById.mockResolvedValueOnce([myShoppingCar]);

      // Act
      await shoppingCarController.findById(exampleReq, shoppingCarId);

      // Asserts
      expect(shoppingCarRepository.findById).toHaveBeenCalledWith(shoppingCarId);
      expect(shoppingCarRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Update shopping car by id', () => {
    it('Should update a shopping car', async () => {
      // Arrange
      const shoppingCarId = new mongoose.Types.ObjectId();
      shoppingCarRepository.findByIdAndUpdate.mockResolvedValueOnce(myShoppingCar);
      shoppingCarCodeAlreadyExists.mockResolvedValueOnce(false);

      // Act
      await shoppingCarController.update(exampleReq, shoppingCarId, myShoppingCar);

      // Asserts
      expect(shoppingCarRepository.findByIdAndUpdate).toHaveBeenCalledWith(shoppingCarId, myShoppingCar);
      expect(shoppingCarRepository.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(shoppingCarCodeAlreadyExists).toHaveBeenCalledWith(myShoppingCar.code);
      expect(shoppingCarCodeAlreadyExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete shopping car by id', () => {
    it('Should delete a shopping car', async () => {
      // Arrange
      const shoppingCarId = new mongoose.Types.ObjectId();
      shoppingCarRepository.findByIdAndDelete.mockResolvedValueOnce(myShoppingCar);

      // Act
      await shoppingCarController.delete(exampleReq, shoppingCarId);

      // Asserts
      expect(shoppingCarRepository.findByIdAndDelete).toHaveBeenCalledWith(shoppingCarId);
      expect(shoppingCarRepository.findByIdAndDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Add product to a shopping car', () => {
    it('Should add a product to a shopping car', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      const shoppingCarId = new mongoose.Types.ObjectId();
      shoppingCarRepository.addProductToShoppingCar.mockResolvedValueOnce(myShoppingCar);

      // Act
      await shoppingCarController.addProduct(exampleReq, shoppingCarId, productId, null);

      // Asserts
      expect(shoppingCarRepository.addProductToShoppingCar).toHaveBeenCalledWith(productId, shoppingCarId, null);
      expect(shoppingCarRepository.addProductToShoppingCar).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete product from shopping car', () => {
    it('Should delete a product from shopping car', async () => {
      // Arrange
      const productId = new mongoose.Types.ObjectId();
      const shoppingCarId = new mongoose.Types.ObjectId();
      shoppingCarRepository.deleteProductFromShoppingCar.mockResolvedValueOnce(myShoppingCar);

      // Act
      await shoppingCarController.deleteProduct(exampleReq, shoppingCarId, productId, null);

      // Asserts
      expect(shoppingCarRepository.deleteProductFromShoppingCar).toHaveBeenCalledWith(productId, shoppingCarId, null);
      expect(shoppingCarRepository.deleteProductFromShoppingCar).toHaveBeenCalledTimes(1);
    });
  });
});
