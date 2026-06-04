/**
 * Password reset email template.
 *
 * @param {object} data
 * @param {string} data.firstname     - recipient's first name
 * @param {string} data.resetUrl      - tokenized password-reset link (required)
 * @param {number} [data.expiryMinutes] - link validity window (default 30)
 */
module.exports = function resetPasswordTemplate(data = {}) {
  const name = data.firstname || 'there';
  const resetUrl = data.resetUrl || '#';
  const expiry = data.expiryMinutes || 30;

  return {
    subject: 'Reset your UrbanOak password',
    text:
      `Hi ${name},\n\n` +
      `We received a request to reset your UrbanOak password. ` +
      `Use the link below to set a new one (valid for ${expiry} minutes):\n\n` +
      `${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password won't change.\n\n` +
      `The UrbanOak Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your UrbanOak password. Click the button below to set a new one. This link is valid for <strong>${expiry} minutes</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background: #8a5a2b; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="margin-top: 24px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p>The UrbanOak Team</p>
      </div>
    `,
  };
};
