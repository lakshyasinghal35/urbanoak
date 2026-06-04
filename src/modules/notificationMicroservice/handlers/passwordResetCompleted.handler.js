const { emailService } = require('../../../common/email');

async function handlePasswordResetCompleted(payload) {
  if (!payload?.email) {
    return;
  }

  await emailService.send({
    to: payload.email,
    template: 'passwordResetComplete',
    data: {
      firstname: payload.firstname,
    },
  });
}

module.exports = {
  handlePasswordResetCompleted,
};
