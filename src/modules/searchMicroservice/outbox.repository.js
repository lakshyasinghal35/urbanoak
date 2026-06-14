const { SearchOutboxModel } = require('../../models/mongoSchemas');
const { isSearchEnabled } = require('../../config/elasticsearch');
const { isMongoEnabled, assertMongoAvailable } = require('../../config/mongo');

const SEARCH_EVENT_TYPES = {
  PRODUCT_UPSERT: 'product_upsert',
  PRODUCT_DELETE: 'product_delete',
};

async function enqueueProductEvent(eventType, productId) {
  if (!isSearchEnabled() || !productId || !isMongoEnabled()) {
    return null;
  }

  assertMongoAvailable();

  return SearchOutboxModel.create({
    event_type: eventType,
    product_id: String(productId),
    status: 'pending',
    attempts: 0,
    last_error: null,
  });
}

async function claimPendingEvents(batchSize) {
  if (!isMongoEnabled()) {
    return [];
  }

  assertMongoAvailable();

  const claimed = [];

  for (let i = 0; i < batchSize; i += 1) {
    const event = await SearchOutboxModel.findOneAndUpdate(
      { status: 'pending' },
      { $set: { status: 'processing' } },
      { sort: { createdAt: 1 }, new: true }
    );
    if (!event) {
      break;
    }
    claimed.push(event);
  }

  return claimed;
}

async function completeEvent(eventId) {
  assertMongoAvailable();

  await SearchOutboxModel.findByIdAndUpdate(eventId, {
    $set: { status: 'completed', last_error: null },
  });
}

async function failEvent(eventId, errorMessage, attempts) {
  assertMongoAvailable();

  const shouldRetry = attempts < 5;
  await SearchOutboxModel.findByIdAndUpdate(eventId, {
    $set: {
      status: shouldRetry ? 'pending' : 'failed',
      last_error: errorMessage,
      attempts,
    },
  });
}

module.exports = {
  SEARCH_EVENT_TYPES,
  enqueueProductEvent,
  claimPendingEvents,
  completeEvent,
  failEvent,
};
