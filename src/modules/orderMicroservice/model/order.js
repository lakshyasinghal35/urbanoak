// Orders (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   items TEXT NOT NULL,
//   delivery_details TEXT NOT NULL,   {'delivery_address': {}, 'tracking_details': {}}
//   billing_details TEXT NOT NULL,
//   total_amount INT NOT NULL,
//   `status` VARCHAR(20),
//   INDEX user_orders (user_id)
// )


class Order {
  constructor({
    id,
    user_id,
    items,
    delivery_details,
    billing_details,
    total_amount,
    status,
  } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.items = typeof items === 'string' ? JSON.parse(items) : items;
    this.delivery_details = typeof delivery_details === 'string' ? JSON.parse(delivery_details) : delivery_details;
    this.billing_details = typeof billing_details === 'string' ? JSON.parse(billing_details) : billing_details;
    this.total_amount = total_amount;
    this.status = status;
  }
}


/**
 * Prepare payload object for message queue based on an order input
 * @param {Order|Object} order
 * @param {string} action
 * @returns {Object} Payload for message queue (all relevant fields)
 */
function getPayload(order, action) {
  // Accept both Order instance or plain object
  if (!order) return {};

  return {
    id: order.id,
    user_id: order.user_id,
    items: order.items,
    delivery_details: order.delivery_details,
    billing_details: order.billing_details,
    total_amount: order.total_amount,
    status: order.status,
    action
  };
};


module.exports = {
  Order,
  getPayload,
};