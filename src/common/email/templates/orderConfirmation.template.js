/**
 * Order confirmation email template.
 *
 * @param {object} data
 * @param {string} data.firstname   - recipient's first name
 * @param {string|number} data.orderId
 * @param {number} [data.total]     - order total amount
 * @param {string} [data.currency]  - currency symbol/code (default '₹')
 * @param {Array<{name: string, quantity: number, price: number}>} [data.items]
 */
module.exports = function orderConfirmationTemplate(data = {}) {
  const name = data.firstname || 'there';
  const orderId = data.orderId ?? 'N/A';
  const currency = data.currency || '₹';
  const items = Array.isArray(data.items) ? data.items : [];

  const itemsText = items
    .map((item) => `  - ${item.name} x${item.quantity} (${currency}${item.price})`)
    .join('\n');

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;">${currency}${item.price}</td>
        </tr>`
    )
    .join('');

  return {
    subject: `Your UrbanOak order #${orderId} is confirmed`,
    text:
      `Hi ${name},\n\nThanks for your order! Your order #${orderId} is confirmed.\n\n` +
      (itemsText ? `Items:\n${itemsText}\n\n` : '') +
      (data.total != null ? `Total: ${currency}${data.total}\n\n` : '') +
      `We'll notify you when it ships.\n\nThe UrbanOak Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">Thanks for your order, ${name}!</h2>
        <p>Your order <strong>#${orderId}</strong> is confirmed.</p>
        ${
          items.length
            ? `<table style="border-collapse: collapse; width: 100%; max-width: 480px; margin: 16px 0;">
                 <thead>
                   <tr>
                     <th style="padding: 6px 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                     <th style="padding: 6px 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                     <th style="padding: 6px 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                   </tr>
                 </thead>
                 <tbody>${itemsHtml}</tbody>
               </table>`
            : ''
        }
        ${data.total != null ? `<p><strong>Total: ${currency}${data.total}</strong></p>` : ''}
        <p style="margin-top: 24px;">We'll notify you when it ships.<br/>The UrbanOak Team</p>
      </div>
    `,
  };
};
