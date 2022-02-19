const express = require('express');
const mongoose = require('mongoose');
const logger = require('@condor-labs/logger');
const { healthMonitor } = require('@condor-labs/health-middleware');
const config = require('config');
const apiRouter = require('./routes/index');

const app = express();
const db = config.get('mongoURI');

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => logger.log('MongoDB Connected...'))
  .catch((err) => logger.log(err));

healthMonitor(app);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: "Welcome to Brayan Hurtado's project demo - Shopping Car.",
  });
});

app.use('/api/v1', apiRouter);

module.exports = app;
