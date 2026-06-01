const { elasticsearchClient, isSearchEnabled } = require('../../config/elasticsearch');
const { SEARCH_INDEX_NAME } = require('./service');
const { PRODUCT_SEARCH_INDEX_SETTINGS } = require('./index.mapping');

async function ensureSearchIndex() {
  if (!isSearchEnabled()) {
    return;
  }

  const client = elasticsearchClient();
  if (!client) {
    return;
  }

  const exists = await client.indices.exists({ index: SEARCH_INDEX_NAME });
  if (exists) {
    return;
  }

  await client.indices.create({
    index: SEARCH_INDEX_NAME,
    ...PRODUCT_SEARCH_INDEX_SETTINGS,
  });
}

module.exports = {
  ensureSearchIndex,
};
