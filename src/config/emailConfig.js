/**
 * Resolves the effective email configuration by layering, in priority order:
 *   1. environment variables (secrets / deploy-time overrides)
 *   2. the `email` block in app.config.json
 *   3. built-in defaults
 *
 * Secrets (SMTP credentials) should be supplied via environment variables in
 * real deployments and kept out of app.config.json.
 */

let appConfig = {};
try {
  // global.config is populated in src/app.js; fall back to a direct require for
  // scripts/tests that load this module before the app bootstraps.
  appConfig = global.config || require('./app.config.json');
} catch (err) {
  appConfig = {};
}

const fileConfig = appConfig.email || {};

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
}

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const fileSmtp = fileConfig.smtp || {};
const fileDefaults = fileConfig.defaults || {};

const emailConfig = {
  enabled: bool(process.env.EMAIL_ENABLED, fileConfig.enabled === true),
  provider: process.env.EMAIL_PROVIDER || fileConfig.provider || 'smtp',
  defaults: {
    from: process.env.EMAIL_FROM || fileDefaults.from || 'UrbanOak <no-reply@urbanoak.com>',
    replyTo: process.env.EMAIL_REPLY_TO || fileDefaults.replyTo || undefined,
  },
  smtp: {
    host: process.env.SMTP_HOST || fileSmtp.host,
    port: num(process.env.SMTP_PORT, fileSmtp.port || 587),
    secure: bool(process.env.SMTP_SECURE, fileSmtp.secure === true),
    pool: bool(process.env.SMTP_POOL, fileSmtp.pool !== false),
    auth: {
      user: process.env.SMTP_USER || fileSmtp.auth?.user || undefined,
      pass: process.env.SMTP_PASS || fileSmtp.auth?.pass || undefined,
    },
  },
};

/**
 * SMTP is only usable when an actual host is configured. When it isn't, the
 * transport factory falls back to the console transport so the app never
 * crashes on a missing mail server (mirrors the redis/kafka guard pattern).
 */
function isSmtpConfigured() {
  return Boolean(emailConfig.smtp.host) && emailConfig.smtp.host !== 'smtp.example.com';
}

function isEmailEnabled() {
  return emailConfig.enabled === true;
}

module.exports = {
  emailConfig,
  isEmailEnabled,
  isSmtpConfigured,
};
