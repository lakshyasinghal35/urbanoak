const config = require('../../config');
const { isSearchEnabled } = require('../../config/elasticsearch');
const { isMongoEnabled, isMongoConnected } = require('../../config/mongo');
const { SEARCH_INDEX_NAME } = require('./service');
const searchRepository = require('./repository');
const outboxRepository = require('./outbox.repository');
const productRepository = require('../productMicroservice/repository');

const SEARCH_CONFIG = config.elasticsearch || {};
const POLL_MS = Number(SEARCH_CONFIG.worker_poll_ms) > 0 ? Number(SEARCH_CONFIG.worker_poll_ms) : 2000;
const BATCH_SIZE = Number(SEARCH_CONFIG.worker_batch_size) > 0 ? Number(SEARCH_CONFIG.worker_batch_size) : 50;

let workerInterval = null;
let isProcessing = false;

async function processEvent(event) {
  const attempts = Number(event.attempts || 0) + 1;
  try {
    if (event.event_type === outboxRepository.SEARCH_EVENT_TYPES.PRODUCT_DELETE) {
      await searchRepository.deleteProductDocument(SEARCH_INDEX_NAME, event.product_id);
    } else {
      const product = await productRepository.getProductById(event.product_id);
      if (!product) {
        await searchRepository.deleteProductDocument(SEARCH_INDEX_NAME, event.product_id);
      } else {
        await searchRepository.upsertProductDocument(SEARCH_INDEX_NAME, product);
      }
    }

    await outboxRepository.completeEvent(event.id);
  } catch (error) {
    await outboxRepository.failEvent(event.id, error.message, attempts);
  }
}

async function processPendingEvents() {
  if (isProcessing || !isSearchEnabled() || !isMongoEnabled() || !isMongoConnected()) {
    return;
  }

  isProcessing = true;
  try {
    const events = await outboxRepository.claimPendingEvents(BATCH_SIZE);
    for (const event of events) {
      // eslint-disable-next-line no-await-in-loop
      await processEvent(event);
    }
  } finally {
    isProcessing = false;
  }
}

function startSearchIndexWorker() {
  if (!isSearchEnabled() || workerInterval) {
    return;
  }

  workerInterval = setInterval(() => {
    processPendingEvents().catch(error => {
      console.error('[search-worker] failed to process events:', error.message);
    });
  }, POLL_MS);
}

module.exports = {
  startSearchIndexWorker,
  processPendingEvents,
};
