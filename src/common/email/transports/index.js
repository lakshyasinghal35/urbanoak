const { emailConfig, isEmailEnabled, isSmtpConfigured } = require('../../../config/emailConfig');
const { createSmtpTransport } = require('./smtpTransport');
const { createConsoleTransport } = require('./consoleTransport');

/**
 * Transport factory (Strategy pattern). Resolves a transport implementation by
 * provider name. To add a new provider (SES, SendGrid, Mailgun, ...), implement
 * the { name, send(message), verify() } contract and register it here.
 *
 * The factory degrades gracefully: when email is disabled or SMTP is not
 * properly configured, it returns the console transport so the app never breaks.
 *
 * @param {object} [options]
 * @param {string} [options.provider] - override the configured provider
 * @param {object} [options.smtp]     - override the configured SMTP settings
 * @param {object} [options.transport] - inject a ready-made transport (tests)
 */
function createTransport(options = {}) {
  if (options.transport) {
    return options.transport;
  }

  if (!isEmailEnabled()) {
    return createConsoleTransport();
  }

  const provider = options.provider || emailConfig.provider;
  const smtp = options.smtp || emailConfig.smtp;

  switch (provider) {
    case 'smtp':
      if (!isSmtpConfigured() && !options.smtp) {
        console.warn('[email] SMTP host not configured; falling back to console transport.');
        return createConsoleTransport();
      }
      return createSmtpTransport(smtp);

    case 'console':
      return createConsoleTransport();

    default:
      console.warn(`[email] unknown provider "${provider}"; falling back to console transport.`);
      return createConsoleTransport();
  }
}

module.exports = { createTransport };
