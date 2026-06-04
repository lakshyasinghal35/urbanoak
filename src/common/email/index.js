/**
 * Email module public API.
 *
 * Usage (shared singleton — the common case):
 *   const { emailService } = require('../../common/email');
 *   await emailService.send({ to: user.email, template: 'welcome', data: { firstname } });
 *
 * Usage (customized instance — different provider/sender, or a fake in tests):
 *   const { createEmailService } = require('../../common/email');
 *   const svc = createEmailService({ defaults: { from: 'Sales <sales@urbanoak.com>' } });
 *   await svc.send({ to, subject, html });
 *
 * Registering a new template:
 *   const { registerTemplate } = require('../../common/email');
 *   registerTemplate('passwordReset', (data) => ({ subject, html, text }));
 */
const { EmailService } = require('./service');
const { renderTemplate, registerTemplate, hasTemplate, templates } = require('./templates');
const { isEmailEnabled, emailConfig } = require('../../config/emailConfig');

/**
 * Factory for building a tailored EmailService instance.
 * @param {object} [options] - see EmailService constructor
 */
function createEmailService(options = {}) {
  return new EmailService(options);
}

// Lazily-created shared singleton for everyday use across the app.
let defaultService = null;
function getEmailService() {
  if (!defaultService) {
    defaultService = new EmailService();
  }
  return defaultService;
}

module.exports = {
  // primary entry points
  emailService: getEmailService(),
  getEmailService,
  createEmailService,
  EmailService,

  // template helpers
  renderTemplate,
  registerTemplate,
  hasTemplate,
  templates,

  // config helpers
  isEmailEnabled,
  emailConfig,
};
