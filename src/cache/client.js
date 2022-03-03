const redis = require('redis');
const logger = require('@condor-labs/logger');
const { settings } = require('../../config/constants');

const client = redis.createClient({
  url: 'redis://'.concat(settings.host, ':', settings.port),
});

client.on('error', (err) => {
  logger.log(err);
});

module.exports = client;
