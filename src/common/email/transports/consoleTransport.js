/**
 * No-op transport used for local development, tests, or whenever email is
 * disabled / SMTP is not configured. It logs the message instead of sending it,
 * so application flows that depend on "sending" an email keep working safely.
 *
 * Implements the transport contract: { name, send(message), verify() }.
 */
function createConsoleTransport() {
  return {
    name: 'console',

    async verify() {
      return true;
    },

    async send(message) {
      const preview = {
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        hasHtml: Boolean(message.html),
        hasText: Boolean(message.text),
        attachments: (message.attachments || []).length,
      };

      console.log('[email:console] message not sent (console transport):', preview);

      return {
        accepted: [].concat(message.to || []),
        rejected: [],
        messageId: `console-${Date.now()}`,
        transport: 'console',
      };
    },
  };
}

module.exports = { createConsoleTransport };
