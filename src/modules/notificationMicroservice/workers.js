const config = require('../../config/app.config.json');
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

  const profileGroupId = profileConfig.group_id || 'urbanoak-notification-profile';
  const profileTopics = profileConfig.topics || [KAFKA_CONFIG.topic?.user_profile_events || 'user_profile_events'];

  const orderGroupId = orderConfig.group_id || 'urbanoak-notification-order';
  const orderTopics = orderConfig.topics || [KAFKA_CONFIG.topic?.order_events || 'order_events'];

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
