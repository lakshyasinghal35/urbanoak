const { getRedisClient } = require('../config/redis');
const CACHE_PREFIX = 'catalog:v1';

async function get(key) {
  const cacheClient = await getRedisClient();
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

async function set(key, value, ttlSeconds) {
  const cacheClient = await getRedisClient();
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

async function save(key, ttlSeconds, loader) {
  const cached = await get(key);
  if (cached != null) {
    return cached;
  }

  const data = await loader();
  await set(key, data, ttlSeconds);
  return data;
}

async function deleteKeys(keys) {
  const cacheClient = await getRedisClient();
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
  const cacheClient = await getRedisClient();
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

function buildCacheKey(...parts) {
  return `${CACHE_PREFIX}:${parts.join(':')}`;
}

function normalizeName(name) {
  return String(name).trim().toLowerCase();
}

module.exports = {
  get,
  set,
  save,
  deleteKeys,
  deleteByPrefix,
  buildCacheKey,
  normalizeName,
};
