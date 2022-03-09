const shoppingCarRepository = require('../src/repositories/shoppingCar.repository');
// const cacheController = require('../src/cache/cache.controller');
const ShoppingCar = require('../src/models/ShoppingCar');
// const { mongoose } = require('@condor-labs/mongodb/src/mongodb');

jest.mock('../src/cache/cache.controller');
jest.mock('../src/models/ShoppingCar');
// jest.mock('../src/repositories/shoppingCar.repository', () => ({ findShoppingCarById: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

const myShoppingCar = {
  code: 'Test shopping car code',
};

describe('Shopping car repository', () => {
  describe('Create new shopping car', () => {
    it('Should create a new shopping car', async () => {
      // Arrange
      const newShoppingCar = new ShoppingCar(myShoppingCar);
      newShoppingCar.save.mockResolvedValueOnce(myShoppingCar);

      // Act
      await shoppingCarRepository.save(myShoppingCar);

      // Asserts
      expect(newShoppingCar.save).toHaveBeenCalledTimes(1);
    });
  });

  // describe('Find shopping car by id', () => {
  //     it('Should find a shopping car by id', async () => {
  //         Arrange
  //         const shoppingCarId = new mongoose.Types.ObjectId();
  //         cacheController.get.mockResolvedValueOnce(null);
  //         cacheController.save.mockResolvedValueOnce(true);
  //         findShoppingCarById.mockResolvedValueOnce([myShoppingCar]);

  //         Act
  //         await shoppingCarRepository.findById(shoppingCarId);

  //         Asserts
  //     });
  // });
});
