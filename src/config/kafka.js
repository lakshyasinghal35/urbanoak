const { Kafka, logLevel } = require('kafkajs');
const config = require('./app.config.json');

const KAFKA_CONFIG = config.kafka || {};
const KAFKA_ENABLED = KAFKA_CONFIG.enabled === true;
const KAFKA_CLIENT_ID = KAFKA_CONFIG.client_id || 'urbanoak-api';
const KAFKA_BROKERS = Array.isArray(KAFKA_CONFIG.brokers) && KAFKA_CONFIG.brokers.length
  ? KAFKA_CONFIG.brokers
  : ['127.0.0.1:9092'];

let kafka = null;
let producer = null;
let connectPromise = null;
let isConnected = false;

function isKafkaEnabled() {
  return KAFKA_ENABLED;
}

function getKafkaProducer() {
  if (!isKafkaEnabled()) {
    return null;
  }

  if (!kafka) {
    kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS,
      logLevel: logLevel.NOTHING,
    });
  }

  if (!producer) {
    producer = kafka.producer();
  }

  return producer;
}

async function connectKafkaProducer() {
  if (!isKafkaEnabled()) {
    return false;
  }

  if (isConnected) {
    return true;
  }

  const client = getKafkaProducer();
  if (!client) {
    return false;
  }

  if (!connectPromise) {
    connectPromise = client.connect()
      .then(() => {
        isConnected = true;
      })
      .finally(() => {
        connectPromise = null;
      });
  }

  await connectPromise;
  return isConnected;
}

module.exports = {
  isKafkaEnabled,
  getKafkaProducer,
  connectKafkaProducer,
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
};
