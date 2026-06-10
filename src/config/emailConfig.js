const config = require('.');

const emailConfig = config.email;

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
