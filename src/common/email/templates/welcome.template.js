/**
 * Welcome email template.
 *
 * A template is a pure function: (data) => { subject, html, text }.
 * Keeping templates as plain functions avoids pulling in a templating engine
 * while staying trivially testable and composable.
 *
 * @param {object} data
 * @param {string} data.firstname - recipient's first name
 */
module.exports = function welcomeTemplate(data = {}) {
  const name = data.firstname || 'there';

  return {
    subject: 'Welcome to UrbanOak',
    text: `Hi ${name},\n\nWelcome to UrbanOak! We're thrilled to have you.\n\nHappy shopping,\nThe UrbanOak Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">Welcome to UrbanOak, ${name}!</h2>
        <p>We're thrilled to have you. Explore handcrafted furniture made to last.</p>
        <p style="margin-top: 24px;">Happy shopping,<br/>The UrbanOak Team</p>
      </div>
    `,
  };
};
