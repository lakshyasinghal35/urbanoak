/**
 * Pending order reminder email template.
 *
 * Sent when an order is awaiting an action (e.g. payment not completed) to nudge
 * the customer to finish checkout.
 *
 * @param {object} data
 * @param {string} data.firstname     - recipient's first name
 * @param {string|number} data.orderId
 * @param {number} [data.total]       - order total amount
 * @param {string} [data.currency]    - currency symbol/code (default '₹')
 * @param {string} [data.checkoutUrl] - link to resume checkout / complete payment
 * @param {Array<{name: string, quantity: number, price: number}>} [data.items]
 */
module.exports = function pendingOrderTemplate(data = {}) {
  const name = data.firstname || 'there';
  const orderId = data.orderId ?? 'N/A';
  const currency = data.currency || '₹';
  const checkoutUrl = data.checkoutUrl;
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
    subject: `Your UrbanOak order #${orderId} is still pending`,
    text:
      `Hi ${name},\n\n` +
      `Your order #${orderId} is still pending and hasn't been completed yet.\n\n` +
      (itemsText ? `Items:\n${itemsText}\n\n` : '') +
      (data.total != null ? `Total: ${currency}${data.total}\n\n` : '') +
      (checkoutUrl ? `Complete your order here: ${checkoutUrl}\n\n` : '') +
      `Items in your cart are not reserved and may sell out.\n\nThe UrbanOak Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin: 0 0 12px;">Your order is still pending</h2>
        <p>Hi ${name},</p>
        <p>Your order <strong>#${orderId}</strong> hasn't been completed yet. Finish checkout before your items sell out.</p>
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
        ${
          checkoutUrl
            ? `<p style="margin: 24px 0;">
                 <a href="${checkoutUrl}"
                    style="background: #8a5a2b; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
                   Complete Your Order
                 </a>
               </p>`
            : ''
        }
        <p style="font-size: 13px; color: #666;">Items in your cart are not reserved and may sell out.</p>
        <p style="margin-top: 24px;">The UrbanOak Team</p>
      </div>
    `,
  };
};
