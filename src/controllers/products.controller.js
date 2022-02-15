const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const Product = require('../models/Product');
const Categories = require('../enums/categories');

// Looks if category name is provided and then compares with valid categories
function isAValidCategory(req) {
    categoryName = req.body.category ? req.body.category : null
    return categoryName ? Categories.includes(categoryName) : false;
}

// Create a new product
exports.save = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (!isAValidCategory(req)) res.status(400).send('Invalid category');
        else {
            const newProduct = new Product(req.body);
            newProduct.save().then(r => {
                res.setHeader('Location', req.baseUrl + '/' + r._id);
                res.status(201).send();
            }).catch(err => {
                res.status(400).send(err.message);
                console.log(err.message);
            })
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Returns all the products
exports.find = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        Product.find().then(items => {
            for (item of items) {
                item._doc = { href: req.baseUrl + '/' + item._doc._id, ...item._doc };
            }
            res.send(items);
        }).catch(err => {
            res.send(err.message);
            console.log(err.message);
        }
        )
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Returns a product by an id provided
exports.findById = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id)) {
            let product = await Product.findById(req.params);
            product._doc = { href: req.originalUrl, ...product._doc };
            res.send(product);
        } else {
            res.status(400).send('Invalid product id');
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Updates a product
exports.update = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (!isAValidCategory(req)) res.status(400).send('Invalid category');
        else {
            Product.findByIdAndUpdate(req.params, req.body).then(() => res.send()
            ).catch(err => {
                res.status(400).send(err.message);
                console.log(err.message);
            });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}