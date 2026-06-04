const { ORDER_EVENTS } = require('../../../common/events/eventTypes');
const { handleOrderCreated } = require('../handlers/orderCreated.handler');
const { handleOrderUpdated } = require('../handlers/orderUpdated.handler');

const ACTION_HANDLERS = {
  [ORDER_EVENTS.CREATED]: handleOrderCreated,
  [ORDER_EVENTS.UPDATED]: handleOrderUpdated,
};

async function processOrderEvent(payload) {
  const handler = ACTION_HANDLERS[payload?.action];
  if (!handler) {
    console.warn('[notification-order] unhandled action', { action: payload?.action });
    return;
  }

  await handler(payload);
}

module.exports = {
  processOrderEvent,
};
