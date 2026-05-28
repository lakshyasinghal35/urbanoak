const config = require('./app.config');

let redisModule = null;
try {
  redisModule = require('redis');
} catch (err) {
  redisModule = null;
}

const CACHE_DISABLED = String(config.CACHE_ENABLED ?? process.env.CACHE_ENABLED ?? 'true').toLowerCase() === 'false';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isTestEnv = process.env.NODE_ENV === 'test';

let client = null;
let connectPromise = null;
let missingDependencyWarningShown = false;
let connectionWarningShown = false;

function canUseRedis() {
  if (CACHE_DISABLED) {
    return false;
  }

  if (!redisModule) {
    if (!missingDependencyWarningShown) {
      missingDependencyWarningShown = true;
      if (!isTestEnv) {
        console.warn('[cache] redis package is not installed. Cache is disabled.');
      }
    }
    return false;
  }

  return true;
}

async function getRedisClient() {
  if (!canUseRedis()) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (!client) {
    client = redisModule.createClient({ url: REDIS_URL });
    client.on('error', error => {
      if (!connectionWarningShown) {
        connectionWarningShown = true;
        if (!isTestEnv) {
          console.warn(`[cache] redis client error: ${error.message}`);
        }
      }
    });
  }

  if (!client.isOpen) {
    if (!connectPromise) {
      connectPromise = client.connect()
        .catch(error => {
          if (!connectionWarningShown) {
            connectionWarningShown = true;
            if (!isTestEnv) {
              console.warn(`[cache] unable to connect to redis: ${error.message}`);
            }
          }
        })
        .finally(() => {
          connectPromise = null;
        });
    }
    await connectPromise;
  }

  return client.isOpen ? client : null;
}

module.exports = {
  getRedisClient,
};
