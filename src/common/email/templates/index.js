const welcome = require('./welcome.template');
const orderConfirmation = require('./orderConfirmation.template');
const resetPassword = require('./resetPassword.template');
const passwordResetComplete = require('./passwordResetComplete.template');
const pendingOrder = require('./pendingOrder.template');

/**
 * Central registry of email templates. A template is a pure function:
 *   (data) => { subject, html, text }
 *
 * Register new templates here by key; the EmailService resolves them by name
 * when callers pass `{ template: '<key>', data: {...} }`.
 */
const templates = {
  welcome,
  orderConfirmation,
  resetPassword,
  passwordResetComplete,
  pendingOrder,
};

function hasTemplate(name) {
  return typeof templates[name] === 'function';
}

/**
 * Renders a registered template into { subject, html, text }.
 * @param {string} name - registered template key
 * @param {object} [data] - data passed to the template function
 */
function renderTemplate(name, data = {}) {
  if (!hasTemplate(name)) {
    throw new Error(`Unknown email template: "${name}". Available: ${Object.keys(templates).join(', ')}`);
  }
  return templates[name](data);
}

/**
 * Allows callers/modules to register additional templates at runtime, keeping
 * the registry open for extension.
 */
function registerTemplate(name, fn) {
  if (typeof fn !== 'function') {
    throw new Error('A template must be a function: (data) => ({ subject, html, text })');
  }
  templates[name] = fn;
}

module.exports = {
  templates,
  hasTemplate,
  renderTemplate,
  registerTemplate,
};
