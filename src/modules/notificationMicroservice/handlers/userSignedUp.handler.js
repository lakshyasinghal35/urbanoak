const { emailService } = require('../../../common/email');

async function handleUserSignedUp(payload) {
  if (!payload?.email) {
    return;
  }

  await emailService.send({
    to: payload.email,
    template: 'welcome',
    data: {
      firstname: payload.firstname,
      lastname: payload.lastname,
    },
  });
}

module.exports = {
  handleUserSignedUp,
};
