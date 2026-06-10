const { Client } = require('@elastic/elasticsearch');
const config = require('.');

const SEARCH_CONFIG = config.elasticsearch || {};
const ELASTICSEARCH_NODE = SEARCH_CONFIG.node;
const isSearchEnabled = () => SEARCH_CONFIG.enabled !== false;

let client = null;



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
  isSearchEnabled
};
