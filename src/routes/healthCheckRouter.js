const express = require('express');
const config = require('../config');
const { pool } = require('../config/db');
const { isMongoEnabled, isMongoConnected } = require('../config/mongo');
const { isSearchEnabled } = require('../config/elasticsearch');
const { isKafkaEnabled } = require('../config/kafka');

const router = express.Router();

async function checkMySQL() {
  try {
    await pool.query('SELECT 1');
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

function getMongoStatus() {
  if (!isMongoEnabled()) {
    return 'disabled';
  }

  return isMongoConnected() ? 'ok' : 'unavailable';
}

function getDependencies() {
  return {
    mysql: null,
    mongodb: getMongoStatus(),
    elasticsearch: isSearchEnabled() ? 'enabled' : 'disabled',
    kafka: isKafkaEnabled() ? 'enabled' : 'disabled',
    cache: config.CACHE_ENABLED !== false ? 'enabled' : 'disabled',
  };
}

function resolveStatus(mysqlStatus, mongoStatus) {
  if (mysqlStatus === 'unavailable') {
    return 'unavailable';
  }

  if (mongoStatus === 'unavailable') {
    return 'degraded';
  }

  return 'ok';
}

router.get('/', (req, res) => {
  res.json({
    name: 'urbanoak',
    status: 'ok',
  });
});

router.get('/health', async (req, res) => {
  const mysqlStatus = await checkMySQL();
  const dependencies = getDependencies();
  dependencies.mysql = mysqlStatus;

  const status = resolveStatus(mysqlStatus, dependencies.mongodb);
  const statusCode = status === 'unavailable' ? 503 : 200;

  res.status(statusCode).json({
    status,
    dependencies,
  });
});

module.exports = router;
