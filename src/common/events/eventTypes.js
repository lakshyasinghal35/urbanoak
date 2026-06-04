const config = require('../../config/app.config.json');

const KAFKA_CONFIG = config.kafka || {};
const KAFKA_TOPICS = KAFKA_CONFIG.topic || {};

const USER_PROFILE_EVENTS = {
  SIGNED_UP: 'user.signed_up',
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
};

const ORDER_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
};

function getUserProfileEventsTopic() {
  return KAFKA_TOPICS.user_profile_events || 'user_profile_events';
}

function getOrderEventsTopic() {
  return KAFKA_TOPICS.order_events || 'order_events';
}

module.exports = {
  USER_PROFILE_EVENTS,
  ORDER_EVENTS,
  getUserProfileEventsTopic,
  getOrderEventsTopic,
};
