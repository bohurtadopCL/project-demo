const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShoppingCarSchema = new Schema({
    code: {
        type: String,
        required: true,
    },
    totalPrice: {
        type: String,
        required: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true,
        quantity: Number
    }]
}, {
    versionKey: false,
});

module.exports = Item = mongoose.model('shoppingCar', ShoppingCarSchema);