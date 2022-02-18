const { mongoose } = require('@condor-labs/mongodb/src/mongodb');
const Product = require('../models/Product');
const ShoppingCar = require('../models/ShoppingCar');

// Looks if shopping car code already exists on database
async function codeAlreadyExists(req) {
    shoppingCarCode = req.body.code || null;
    oldShoppingCar = shoppingCarCode ? await ShoppingCar.findOne({
        code: shoppingCarCode
    }) : true;
    return oldShoppingCar ? true : false;
}

// Create a new shopping car
exports.save = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (await codeAlreadyExists(req)) res.status(400).send('Invalid shopping car code');
        else {
            const newShoppingCar = new ShoppingCar(req.body);
            newShoppingCar.save().then(r => {
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

// Returns all the shopping cars
exports.find = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        ShoppingCar.aggregate([
            {
                $lookup: {
                    from: "products",
                    let: {
                        p: "$products"
                    },
                    pipeline: [
                        {
                            $match: { $expr: { $in: ["$_id", "$$p._id"] } }
                        },
                        {
                            $project: {
                                _id: "$_id",
                                code: "$code",
                                name: "$name",
                                price: "$price",
                                category: "$category",
                                quantity: {
                                    $let: {
                                        vars: {
                                            index: { $indexOfArray: ["$$p._id", "$_id"] },
                                        },
                                        in: {
                                            $let: {
                                                vars: {
                                                    prod: { $arrayElemAt: ["$$p", "$$index"] }
                                                },
                                                in: "$$prod.quantity",
                                            }
                                        }
                                    }
                                },
                            }
                        }
                    ],
                    as: "products"
                }
            },
            {
                $set: {
                    totalPrice: {
                        $sum: {
                            $map: {
                                input: "$products",
                                as: "product",
                                in: { $multiply: ["$$product.price", "$$product.quantity"] }
                            }
                        }
                    },
                }
            },
        ]).then(items => {
            for (i of items) {
                i.href = req.baseUrl + '/' + i._id;
            }
            res.send(items);
        }).catch(err => {
            res.send(err.message);
            console.log(err.message);
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Returns a shopping car by an id provided
exports.findById = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id)) {
            let id = new mongoose.Types.ObjectId(req.params._id);
            let shoppingCar = await ShoppingCar.aggregate([
                {
                    $match: { $expr: { $eq: ["$_id", id] } }
                },
                {
                    $lookup: {
                        from: "products",
                        let: {
                            p: "$products"
                        },
                        pipeline: [
                            {
                                $match: { $expr: { $in: ["$_id", "$$p._id"] } }
                            },
                            {
                                $project: {
                                    _id: "$_id",
                                    code: "$code",
                                    name: "$name",
                                    price: "$price",
                                    category: "$category",
                                    quantity: {
                                        $let: {
                                            vars: {
                                                index: { $indexOfArray: ["$$p._id", "$_id"] },
                                            },
                                            in: {
                                                $let: {
                                                    vars: {
                                                        prod: { $arrayElemAt: ["$$p", "$$index"] }
                                                    },
                                                    in: "$$prod.quantity",
                                                }
                                            }
                                        }
                                    },
                                }
                            }
                        ],
                        as: "products"
                    }
                },
                {
                    $set: {
                        totalPrice: {
                            $sum: {
                                $map: {
                                    input: "$products",
                                    as: "product",
                                    in: { $multiply: ["$$product.price", "$$product.quantity"] }
                                }
                            }
                        },
                    }
                },
            ]);
            if (!shoppingCar) res.status(404).send('Shopping car not found')
            else {
                shoppingCar[0].href = req.originalUrl;
                res.send(shoppingCar[0]);
            }
        } else {
            res.status(400).send('Invalid shopping car id');
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Updates a shopping car
exports.update = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (codeAlreadyExists(req)) res.status(400).send('Invalid shopping car code');
        else {
            ShoppingCar.findByIdAndUpdate(req.params, req.body).then(() => res.send()
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

// Deletes a shopping car by an id provided
exports.deleteShoppingCar = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id)) {
            ShoppingCar.findByIdAndDelete(req.params).then(() => {
                res.send();
            }).catch(err => {
                res.status(400).send(err.message);
                console.log(err.message);
            });
        } else {
            res.status(400).send('Invalid shopping car id');
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send();
    }
}

// Add a given quantity of a product by shopping car's id and product's id
exports.addProduct = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id) && mongoose.Types.ObjectId.isValid(req.params._pid)) {
            let shoppingCar = await ShoppingCar.findById(req.params._id);
            let product = await Product.findById(req.params._pid);
            if (!shoppingCar) res.status(400).send('Shopping car not found');
            else if (!product) res.status(400).send('Product not found');
            else {
                let products = shoppingCar._doc.products;
                product = { ...product._doc, quantity: req.body.quantity || 1 };
                let found = await products.find(e => e._id.equals(product._id) ? e.quantity += product.quantity : null);
                found ? null : products.push(product);
                let updatedShoppingCar = await ShoppingCar.findByIdAndUpdate(req.params, {
                    products: products
                });
                updatedShoppingCar ? res.send() : res.status(500).send();
            }
        } else {
            res.status(400).send('Invalid object ids');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
}

// Deletes a given quantity of a product in a shopping car
exports.deleteProduct = async function (req, res) {
    console.log('\t', req.method, '\t', req.originalUrl);
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id) && mongoose.Types.ObjectId.isValid(req.params._pid)) {
            let shoppingCar = await ShoppingCar.findById(req.params._id);
            let product = await Product.findById(req.params._pid);
            if (!shoppingCar) res.status(400).send('Shopping car not found');
            else if (!product) res.status(400).send('Product not found');
            else {
                let products = shoppingCar._doc.products;
                product = { ...product._doc, quantity: req.body.quantity };
                await products.forEach((e, i) => {
                    e._id.equals(product._id) ?
                        product.quantity ?
                            e.quantity > product.quantity ?
                                e.quantity -= product.quantity
                                : products.splice(i, 1) :
                            products.splice(i, 1) : null;
                });
                let updatedShoppingCar = await ShoppingCar.findByIdAndUpdate(req.params, {
                    products: products
                });
                updatedShoppingCar ? res.send() : res.status(500).send();
            }
        } else {
            res.status(400).send('Invalid object ids');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send();
    }
}