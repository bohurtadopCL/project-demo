const express = require('express');
const mongoose = require('mongoose');
const config = require('config');

const app = express();
const db = config.get('mongoURI');
const apiRouter = require('./routes/index');

const shoppingCar = require('./models/ShoppingCar');
const Product = require('./models/Product');

mongoose.connect(db, { useNewUrlParser: true }).then(() => console.log('MongoDB Connected...')).catch(err => console.log(err));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: "Welcome to Brayan Hurtado's project demo - Shopping Car."
    })
})

app.use('/api/v1', apiRouter);

app.listen(3000, () => console.log('Server on port 3000'));