const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShoppingCarSchema = new Schema({
    code: {
        type: String,
        required: true,
    },
    totalPrice: {
        type: String,
        required: false,
    },
    products: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: false,
        },
        quantity: {
            type: Number,
            required: true
        }
    }]
}, {
    versionKey: false,
});

module.exports = Item = mongoose.model('shoppingCar', ShoppingCarSchema);