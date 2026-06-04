const {
  isKafkaEnabled,
  connectKafkaConsumer,
  getKafkaConsumer,
} = require('../../config/kafka');

function parseMessageValue(message) {
  const raw = message.value?.toString();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('[message-consumer] invalid JSON payload', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Subscribes to Kafka topics and invokes onEvent for each parsed message payload.
 * @param {object} options
 * @param {string} options.groupId - Kafka consumer group id
 * @param {string[]} options.topics - topic names to subscribe
 * @param {(ctx: { topic: string, partition: number, payload: object, message: object }) => Promise<void>} options.onEvent
 */
async function runConsumer({ groupId, topics, onEvent }) {
  if (!isKafkaEnabled()) {
    return null;
  }

  if (!groupId || !Array.isArray(topics) || topics.length === 0) {
    throw new Error('runConsumer requires groupId and at least one topic');
  }
  if (typeof onEvent !== 'function') {
    throw new Error('runConsumer requires onEvent handler');
  }

  await connectKafkaConsumer(groupId);
  const consumer = getKafkaConsumer(groupId);
  if (!consumer) {
    return null;
  }

  await consumer.subscribe({ topics, fromBeginning: false });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = parseMessageValue(message);
      if (!payload) {
        return;
      }

      try {
        await onEvent({ topic, partition, payload, message });
      } catch (error) {
        console.error('[message-consumer] handler failed', {
          topic,
          partition,
          action: payload?.action,
          error: error.message,
        });
      }
    },
  });

  return consumer;
}

module.exports = {
  parseMessageValue,
  runConsumer,
};
