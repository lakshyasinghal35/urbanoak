const { Client } = require('@elastic/elasticsearch');
const config = require('./app.config.json');

const SEARCH_CONFIG = config.elasticsearch || {};
const SEARCH_ENABLED = SEARCH_CONFIG.enabled !== false;
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_URL || SEARCH_CONFIG.node || 'http://127.0.0.1:9200';

let client = null;

function isSearchEnabled() {
  return SEARCH_ENABLED;
}

function elasticsearchClient() {
  if (!isSearchEnabled()) {
    return null;
  }

  if (!client) {
    client = new Client({ node: ELASTICSEARCH_NODE });
  }

  return client;
}

module.exports = {
  elasticsearchClient,
  isSearchEnabled,
  ELASTICSEARCH_NODE,
};
