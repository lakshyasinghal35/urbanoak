let redisModule = null;
try {
  redisModule = require('redis');
} catch (err) {
  redisModule = null;
}

const CACHE_DISABLED = String(process.env.CACHE_ENABLED || 'true').toLowerCase() === 'false';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let client = null;
let connectPromise = null;
let missingDependencyWarningShown = false;
let connectionWarningShown = false;
const isTestEnv = process.env.NODE_ENV === 'test';

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

async function getClient() {
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

async function getJSON(key) {
  const cacheClient = await getClient();
  if (!cacheClient) {
    return null;
  }

  const value = await cacheClient.get(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

async function setJSON(key, value, ttlSeconds) {
  const cacheClient = await getClient();
  if (!cacheClient || value == null) {
    return;
  }

  const payload = JSON.stringify(value);
  if (ttlSeconds && Number(ttlSeconds) > 0) {
    await cacheClient.set(key, payload, { EX: Number(ttlSeconds) });
    return;
  }

  await cacheClient.set(key, payload);
}

async function rememberJSON(key, ttlSeconds, loader) {
  const cached = await getJSON(key);
  if (cached != null) {
    return cached;
  }

  const data = await loader();
  await setJSON(key, data, ttlSeconds);
  return data;
}

async function deleteKeys(keys) {
  const cacheClient = await getClient();
  if (!cacheClient || !Array.isArray(keys) || keys.length === 0) {
    return;
  }

  const validKeys = keys.filter(Boolean);
  if (!validKeys.length) {
    return;
  }

  await cacheClient.del(validKeys);
}

async function deleteByPrefix(prefixes) {
  const cacheClient = await getClient();
  if (!cacheClient || !Array.isArray(prefixes) || prefixes.length === 0) {
    return;
  }

  for (const prefix of prefixes.filter(Boolean)) {
    let cursor = '0';

    do {
      const result = await cacheClient.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100,
      });
      cursor = result.cursor;
      if (result.keys?.length) {
        await cacheClient.del(result.keys);
      }
    } while (cursor !== '0');
  }
}

module.exports = {
  getJSON,
  setJSON,
  rememberJSON,
  deleteKeys,
  deleteByPrefix,
};
