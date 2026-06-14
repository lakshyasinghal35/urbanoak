const config = require('.');
const ApiError = require('../common/apiError');

function isMongoEnabled() {
  return config.mongoDB.enabled !== false;
}

function isMongoConnected() {
  const { mongoose } = require('./db');
  return mongoose.connection.readyState === 1;
}

function assertMongoAvailable() {
  if (!isMongoEnabled()) {
    throw ApiError.serviceUnavailable('Database service is unavailable');
  }

  if (!isMongoConnected()) {
    throw ApiError.serviceUnavailable('Database service is unavailable');
  }
}

module.exports = {
  isMongoEnabled,
  isMongoConnected,
  assertMongoAvailable,
};
