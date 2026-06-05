const config = require('../../config');
const { isKafkaEnabled } = require('../../config/kafka');
const { runConsumer } = require('../../common/events/messageConsumer');
const { processUserProfileEvent } = require('./processors/userProfile.processor');
const { processOrderEvent } = require('./processors/order.processor');

const KAFKA_CONFIG = config.kafka || {};
const CONSUMER_CONFIG = KAFKA_CONFIG.consumer || {};

let workersStarted = false;

async function startNotificationWorkers() {
  if (!isKafkaEnabled() || workersStarted) {
    return;
  }

  workersStarted = true;

  const profileConfig = CONSUMER_CONFIG.user_profile || {};
  const orderConfig = CONSUMER_CONFIG.order || {};

  const profileGroupId = profileConfig.group_id;
  const profileTopics = profileConfig.topics;

  const orderGroupId = orderConfig.group_id;
  const orderTopics = orderConfig.topics;

  await Promise.all([
    runConsumer({
      groupId: profileGroupId,
      topics: profileTopics,
      onEvent: async ({ payload }) => processUserProfileEvent(payload),
    }),
    runConsumer({
      groupId: orderGroupId,
      topics: orderTopics,
      onEvent: async ({ payload }) => processOrderEvent(payload),
    }),
  ]);
}

module.exports = {
  startNotificationWorkers,
};
