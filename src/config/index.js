/**
 * Central application configuration.
 *
 * Resolution order for every setting:
 *   1. environment variable
 *   2. app.config.json
 *   3. built-in default (where applicable)
 */
const { appEnv } = require('./loadEnv');
const fileConfig = require('./app.config.json');
const {
  str,
  bool,
  num,
  csv,
  isLocalHost,
  isLocalServiceUrl,
  isLocalKafkaBroker,
} = require('./helpers');

const fileMySQL = fileConfig.mySQL || {};
const fileMongo = fileConfig.mongoDB || {};
const fileJwt = fileConfig.jwt || {};
const fileAdmin = fileConfig.admin || {};
const filePasswordReset = fileConfig.passwordReset || {};
const fileHttps = fileConfig.https || {};
const fileS3 = fileConfig.s3 || {};
const fileSearch = fileConfig.elasticsearch || {};
const fileKafka = fileConfig.kafka || {};
const fileEmail = fileConfig.email || {};
const fileEmailSmtp = fileEmail.smtp || {};
const fileEmailDefaults = fileEmail.defaults || {};
const fileRedis = fileConfig.redis || {};

const config = {
  appEnv,
  nodeEnv: str(process.env.NODE_ENV, 'development'),

  httpPort: num(process.env.HTTP_PORT, fileConfig.httpPort ?? 9000),
  httpsPort: num(process.env.HTTPS_PORT, fileConfig.httpsPort ?? 8090),
  sessionExpiry: num(process.env.SESSION_EXPIRY, fileConfig.sessionExpiry ?? 300),
  sessionSecret: str(process.env.SESSION_SECRET, fileConfig.sessionSecret),
  isHttps: bool(process.env.IS_HTTPS, fileConfig.isHttps === 1 || fileConfig.isHttps === true),
  isSessionRequired: bool(process.env.IS_SESSION_REQUIRED, fileConfig.isSessionRequired === 1 || fileConfig.isSessionRequired === true),
  staticResourcePaths: fileConfig.staticResourcePaths || ['public'],

  https: {
    keyPath: str(process.env.HTTPS_KEY_PATH, fileHttps.keyPath),
    certPath: str(process.env.HTTPS_CERT_PATH, fileHttps.certPath),
    caPath: str(process.env.HTTPS_CA_PATH, fileHttps.caPath),
  },

  jwt: {
    secret: str(process.env.JWT_SECRET, fileJwt.secret || 'urbanoak-secret'),
    expires_in: str(process.env.JWT_EXPIRES_IN, fileJwt.expires_in || '1h'),
  },

  admin: {
    allowed_roles: fileAdmin.allowed_roles || ['superadmin', 'admin'],
    min_password_length: num(process.env.ADMIN_MIN_PASSWORD_LENGTH, fileAdmin.min_password_length ?? 8),
  },

  passwordReset: {
    url_base: str(process.env.PASSWORD_RESET_URL_BASE, filePasswordReset.url_base),
    token_ttl_minutes: num(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, filePasswordReset.token_ttl_minutes ?? 60),
    min_password_length: num(process.env.PASSWORD_RESET_MIN_PASSWORD_LENGTH, filePasswordReset.min_password_length ?? 8),
  },

  mySQL: {
    host: str(process.env.MYSQL_HOST, fileMySQL.host),
    port: num(process.env.MYSQL_PORT, fileMySQL.port ?? 3306),
    database_name: str(process.env.MYSQL_DATABASE, fileMySQL.database_name),
    user: str(process.env.MYSQL_USER, fileMySQL.user),
    password: str(process.env.MYSQL_PASSWORD, fileMySQL.password),
  },

  mongoDB: {
    enabled: bool(process.env.MONGO_ENABLED, fileMongo.enabled !== false),
    host: str(process.env.MONGO_HOST, fileMongo.host),
    port: num(process.env.MONGO_PORT, fileMongo.port ?? 27017),
    database_name: str(process.env.MONGO_DATABASE, fileMongo.database_name),
    user: str(process.env.MONGO_USER, fileMongo.user),
    password: str(process.env.MONGO_PASSWORD, fileMongo.password),
    auth_mechanism: str(process.env.MONGO_AUTH_MECHANISM, fileMongo.auth_mechanism || 'SCRAM-SHA-1'),
    auth_source: str(process.env.MONGO_AUTH_SOURCE, fileMongo.auth_source || 'admin'),
  },

  s3: {
    region: str(process.env.S3_REGION, fileS3.region || 'ap-south-1'),
    bucket_name: str(process.env.S3_BUCKET_NAME, fileS3.bucket_name),
    catalog_prefix: str(process.env.S3_CATALOG_PREFIX, fileS3.catalog_prefix || 'catalog'),
    public_base_url: str(process.env.S3_PUBLIC_BASE_URL, fileS3.public_base_url || ''),
    max_image_size_bytes: num(process.env.S3_MAX_IMAGE_SIZE_BYTES, 10 * 1024 * 1024),
  },

  elasticsearch: {
    enabled: bool(process.env.ELASTICSEARCH_ENABLED, fileSearch.enabled !== false),
    node: str(process.env.ELASTICSEARCH_URL, fileSearch.node),
    index_name: str(process.env.ELASTICSEARCH_INDEX_NAME, fileSearch.index_name),
    worker_poll_ms: num(process.env.ELASTICSEARCH_WORKER_POLL_MS, fileSearch.worker_poll_ms ?? 2000),
    worker_batch_size: num(process.env.ELASTICSEARCH_WORKER_BATCH_SIZE, fileSearch.worker_batch_size ?? 10),
  },

  kafka: {
    enabled: bool(process.env.KAFKA_ENABLED, fileKafka.enabled === true),
    client_id: str(process.env.KAFKA_CLIENT_ID, fileKafka.client_id),
    brokers: csv(process.env.KAFKA_BROKERS, fileKafka.brokers || []),
    topic: fileKafka.topic || {
      user_profile_events: 'user_profile_events',
      order_events: 'order_events',
    },
    consumer: fileKafka.consumer || {},
  },

  email: {
    enabled: bool(process.env.EMAIL_ENABLED, fileEmail.enabled === true),
    provider: str(process.env.EMAIL_PROVIDER, fileEmail.provider || 'smtp'),
    defaults: {
      from: str(process.env.EMAIL_FROM, fileEmailDefaults.from || 'UrbanOak <no-reply@urbanoak.com>'),
      replyTo: str(process.env.EMAIL_REPLY_TO, fileEmailDefaults.replyTo || '') || undefined,
    },
    smtp: {
      host: str(process.env.SMTP_HOST, fileEmailSmtp.host),
      port: num(process.env.SMTP_PORT, fileEmailSmtp.port ?? 587),
      secure: bool(process.env.SMTP_SECURE, fileEmailSmtp.secure === true),
      pool: bool(process.env.SMTP_POOL, fileEmailSmtp.pool !== false),
      auth: {
        user: str(process.env.SMTP_USER, fileEmailSmtp.auth?.user || '') || undefined,
        pass: str(process.env.SMTP_PASS, fileEmailSmtp.auth?.pass || '') || undefined,
      },
    },
  },

  CACHE_ENABLED: bool(process.env.CACHE_ENABLED, fileConfig.CACHE_ENABLED !== false),
  REDIS_URL: str(process.env.REDIS_URL, fileRedis.url),
};

function validateConfig() {
  const errors = [];

  const isDeployed =
    config.appEnv === 'production'
    || config.appEnv === 'staging'
    || config.nodeEnv === 'production';

  if (!config.mySQL.host) errors.push('MYSQL_HOST is required');
  if (!config.mySQL.database_name) errors.push('MYSQL_DATABASE is required');
  if (!config.mySQL.user) errors.push('MYSQL_USER is required');
  if (config.mongoDB.enabled) {
    if (!config.mongoDB.host) errors.push('MONGO_HOST is required');
    if (!config.mongoDB.database_name) errors.push('MONGO_DATABASE is required');
  } else if (isDeployed) {
    errors.push('MONGO_ENABLED=false is not allowed in deployed environments');
  }
  if (!config.jwt.secret) errors.push('JWT_SECRET is required');

  if (isDeployed) {
    const insecureDefaults = [];
    if (config.jwt.secret === 'urbanoak-secret') insecureDefaults.push('JWT_SECRET');
    if (config.sessionSecret === 'secretkey') insecureDefaults.push('SESSION_SECRET');
    if (config.mySQL.password === 'root') insecureDefaults.push('MYSQL_PASSWORD');
    if (config.mongoDB.enabled && config.mongoDB.password === 'root') {
      insecureDefaults.push('MONGO_PASSWORD');
    }

    if (insecureDefaults.length) {
      errors.push(`deployed environments require secure env overrides for: ${insecureDefaults.join(', ')}`);
    }

    if (isLocalHost(config.mySQL.host)) {
      errors.push('MYSQL_HOST must not be localhost in deployed environments (set MYSQL_HOST)');
    }

    if (config.mongoDB.enabled && isLocalHost(config.mongoDB.host)) {
      errors.push('MONGO_HOST must not be localhost in deployed environments (set MONGO_HOST)');
    }

    if (config.kafka.enabled) {
      if (!config.kafka.brokers.length) {
        errors.push('KAFKA_BROKERS is required when KAFKA_ENABLED=true in deployed environments');
      } else if (config.kafka.brokers.every(isLocalKafkaBroker)) {
        errors.push('KAFKA_BROKERS must not point to localhost when KAFKA_ENABLED=true in deployed environments');
      }
    }

    if (config.elasticsearch.enabled && isLocalServiceUrl(config.elasticsearch.node)) {
      errors.push('ELASTICSEARCH_URL must not be localhost when ELASTICSEARCH_ENABLED=true in deployed environments');
    }

    if (config.CACHE_ENABLED && isLocalServiceUrl(config.REDIS_URL)) {
      errors.push('REDIS_URL must not be localhost when CACHE_ENABLED=true in deployed environments');
    }
  }

  if (errors.length) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }
}

validateConfig();

module.exports = config;
