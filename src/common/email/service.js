const { emailConfig } = require('../../config/emailConfig');
const { createTransport } = require('./transports');
const { renderTemplate } = require('./templates');

/**
 * Generic, args-driven email service.
 *
 * One public method, `send(args)`, handles every use case. Content can be
 * supplied directly (subject/html/text) or via a registered template
 * (`template` + `data`). Explicitly-passed subject/html/text always override
 * the rendered template output, so a single template can be tweaked per call.
 *
 * The service is transport-agnostic: it delegates the actual delivery to a
 * transport resolved by the factory (Strategy pattern), which means switching
 * providers or injecting a fake transport for tests requires no changes here.
 */
class EmailService {
  /**
   * @param {object} [options]
   * @param {object} [options.defaults]  - default { from, replyTo } for every send
   * @param {string} [options.provider]  - provider override ('smtp' | 'console')
   * @param {object} [options.smtp]      - SMTP settings override
   * @param {object} [options.transport] - inject a ready-made transport (tests)
   */
  constructor(options = {}) {
    this.defaults = { ...emailConfig.defaults, ...(options.defaults || {}) };
    this.transport = createTransport(options);
  }

  /**
   * Builds the final, transport-ready message from caller args.
   * @private
   */
  _buildMessage(args = {}) {
    const {
      to,
      cc,
      bcc,
      from,
      replyTo,
      subject,
      html,
      text,
      template,
      data,
      attachments,
      headers,
    } = args;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      throw new Error('email "to" is required');
    }

    // Resolve content: template provides a base, explicit fields override it.
    let rendered = {};
    if (template) {
      rendered = renderTemplate(template, data || {});
    }

    const finalSubject = subject ?? rendered.subject;
    const finalHtml = html ?? rendered.html;
    const finalText = text ?? rendered.text;

    if (!finalSubject) {
      throw new Error('email "subject" is required (pass `subject` or a `template`)');
    }
    if (!finalHtml && !finalText) {
      throw new Error('email body is required (pass `html`, `text`, or a `template`)');
    }

    const message = {
      from: from || this.defaults.from,
      to,
      subject: finalSubject,
    };

    if (cc) message.cc = cc;
    if (bcc) message.bcc = bcc;
    if (replyTo || this.defaults.replyTo) message.replyTo = replyTo || this.defaults.replyTo;
    if (finalHtml) message.html = finalHtml;
    if (finalText) message.text = finalText;
    if (attachments) message.attachments = attachments;
    if (headers) message.headers = headers;

    return message;
  }

  /**
   * Sends an email.
   *
   * @param {object} args
   * @param {string|string[]} args.to                 - recipient(s) (required)
   * @param {string|string[]} [args.cc]
   * @param {string|string[]} [args.bcc]
   * @param {string} [args.from]                       - overrides default sender
   * @param {string} [args.replyTo]
   * @param {string} [args.subject]                    - required unless `template` provides one
   * @param {string} [args.html]
   * @param {string} [args.text]
   * @param {string} [args.template]                   - registered template key
   * @param {object} [args.data]                       - data passed to the template
   * @param {Array}  [args.attachments]                - nodemailer-style attachments
   * @param {object} [args.headers]                    - custom headers
   * @returns {Promise<{accepted, rejected, messageId, transport}>}
   */
  async send(args = {}) {
    const message = this._buildMessage(args);
    return this.transport.send(message);
  }

  /**
   * Convenience wrapper for template-based sends.
   * @param {string} template - registered template key
   * @param {object} args     - send args (must include `to`); `data` feeds the template
   */
  async sendTemplate(template, args = {}) {
    return this.send({ ...args, template });
  }

  /**
   * Verifies the underlying transport connection (useful at startup/health checks).
   * @returns {Promise<boolean>}
   */
  async verify() {
    if (typeof this.transport.verify === 'function') {
      return this.transport.verify();
    }
    return true;
  }
}

module.exports = { EmailService };
