const nodemailer = require('nodemailer');

/**
 * SMTP transport backed by nodemailer. The underlying nodemailer transporter is
 * created lazily and reused (connection pooling), matching the lazy-singleton
 * style used by the kafka/redis config wrappers.
 *
 * Implements the transport contract: { name, send(message), verify() }.
 *
 * @param {object} smtpConfig - { host, port, secure, pool, auth: { user, pass } }
 */
function createSmtpTransport(smtpConfig = {}) {
  let transporter = null;

  function getTransporter() {
    if (transporter) {
      return transporter;
    }

    const options = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure === true,
      pool: smtpConfig.pool !== false,
    };

    // Only attach auth when credentials are present (some relays are open/IP-allowlisted).
    if (smtpConfig.auth?.user && smtpConfig.auth?.pass) {
      options.auth = { user: smtpConfig.auth.user, pass: smtpConfig.auth.pass };
    }

    transporter = nodemailer.createTransport(options);
    return transporter;
  }

  return {
    name: 'smtp',

    async verify() {
      return getTransporter().verify();
    },

    async send(message) {
      const info = await getTransporter().sendMail(message);
      return {
        accepted: info.accepted,
        rejected: info.rejected,
        messageId: info.messageId,
        response: info.response,
        transport: 'smtp',
      };
    },
  };
}

module.exports = { createSmtpTransport };
