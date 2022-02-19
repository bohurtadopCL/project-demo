const logger = require('@condor-labs/logger');
const app = require('./index');

const server = app.listen(3000, () => logger.log('Server on port 3000'));

module.exports = server;
