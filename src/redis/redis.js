const redis = require('redis');
const logger = require('@condor-labs/logger');
const { settings } = require('../../config/constants');

const client = redis.createClient(settings.port);

client.on('error', (err) => {
  logger.log(err);
});
client.connect();

module.exports = client;
