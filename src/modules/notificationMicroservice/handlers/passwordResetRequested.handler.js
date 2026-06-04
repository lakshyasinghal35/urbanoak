const { emailService } = require('../../../common/email');

async function handlePasswordResetRequested(payload) {
  if (!payload?.email) {
    return;
  }

  await emailService.send({
    to: payload.email,
    template: 'resetPassword',
    data: {
      firstname: payload.firstname,
      resetUrl: payload.resetUrl,
      expiryMinutes: payload.expiryMinutes,
    },
  });
}

module.exports = {
  handlePasswordResetRequested,
};
