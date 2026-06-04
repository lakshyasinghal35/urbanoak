const {
  isKafkaEnabled,
  connectKafkaProducer,
  getKafkaProducer,
} = require('../../config/kafka');

async function sendKafkaMessage({ topic, message }) {
  if (!isKafkaEnabled()) {
    return false;
  }

  await connectKafkaProducer();
  const client = getKafkaProducer();
  if (!client) {
    return false;
  }

  await client.send({
    topic,
    messages: [message],
  });
  return true;
}

async function pushMessage({
  topic,
  key,
  payload,
  context = {},
}) {
  if (!isKafkaEnabled()) {
    return false;
  }

  try {
    await sendKafkaMessage({
      topic,
      message: {
        key: String(key),
        value: JSON.stringify(payload),
      },
    });
    return true;
  } catch (error) {
    console.error('[message-producer] failed to publish event', {
      topic,
      key: String(key),
      action: payload?.action,
      ...context,
      error: error.message,
    });
    return false;
  }
}

module.exports = {
  sendKafkaMessage,
  pushMessage,
};
