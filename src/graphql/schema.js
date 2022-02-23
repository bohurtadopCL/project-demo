const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `

    type Product {
        _id: String
        code: String
        name: String
        price: Int
        category: String
    }

    type ShoppingCarProduct {
        _id: String
        code: String
        name: String
        price: Int
        category: String
        quantity: Int
    }

    type ShoppingCar {
        _id: String
        code: String
        products: [ShoppingCarProduct]
        totalPrice: Int
    }

    input ProductInput {
        code: String
        name: String
        price: Int
        category: String
    }

    input ShoppingCarInput {
        code: String
    }

    type Query {
        getProducts(offset: Int, limit: Int): [Product]
    }

    type Query {
        getProduct(id: String): Product
    }

    type Mutation {
        saveProduct(input: ProductInput): Product
    }

    type Mutation {
        updateProduct(
            id: String
            input: ProductInput
        ): Product
    }

    type Mutation {
        deleteProduct(id: String): Product
    }

    type Query {
        getShoppingCars(offset: Int, limit: Int): [ShoppingCar]
    }

    type Query {
        getShoppingCar(id: String): ShoppingCar
    }

    type Mutation {
        saveShoppingCar(input: ShoppingCarInput): ShoppingCar
    }

    type Mutation {
        deleteShoppingCar(id: String): ShoppingCar
    }

    type Mutation {
        addProductToShoppingCar(
            shoppingCarId: String
            productId: String
            quantity: Int
        ): ShoppingCar
    }

    type Mutation {
        deleteProductFromShoppingCar(
            shoppingCarId: String
            productId: String
            quantity: Int
        ): ShoppingCar
    }
`;

module.exports = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers,
});
