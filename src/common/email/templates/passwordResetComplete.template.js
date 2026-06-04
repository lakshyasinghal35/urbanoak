/**
 * Password reset completion confirmation email.
 *
 * @param {object} data
 * @param {string} data.firstname - recipient's first name
 */
module.exports = function passwordResetCompleteTemplate(data = {}) {
  const name = data.firstname || 'there';

  return {
    subject: 'Your UrbanOak password was changed',
    text:
      `Hi ${name},\n\n` +
      `Your UrbanOak password was successfully changed.\n\n` +
      `If you did not make this change, contact support immediately.\n\n` +
      `The UrbanOak Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">Password updated</h2>
        <p>Hi ${name},</p>
        <p>Your UrbanOak password was successfully changed.</p>
        <p style="margin-top: 24px;">If you did not make this change, contact support immediately.</p>
        <p>The UrbanOak Team</p>
      </div>
    `,
  };
};
