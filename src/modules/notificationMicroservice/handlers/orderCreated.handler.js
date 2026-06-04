const { emailService } = require('../../../common/email');
const userRepository = require('../../profileMicroservice/repository');

function mapOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    name: item.name || `Product ${item.product_id}`,
    quantity: item.quantity,
    price: item.price != null ? item.price : 0,
  }));
}

async function handleOrderCreated(payload) {
  const user = payload?.user_id
    ? await userRepository.getUserById(payload.user_id)
    : null;

  if (!user?.email) {
    console.warn('[notification-order] skipping order.created email: user not found', {
      userId: payload?.user_id,
      orderId: payload?.id,
    });
    return;
  }

  const template = payload.status === 'pending' ? 'pendingOrder' : 'orderConfirmation';
  const emailData = {
    firstname: user.firstname,
    orderId: payload.id,
    total: payload.total_amount,
    items: mapOrderItems(payload.items),
  };

  await emailService.send({
    to: user.email,
    template,
    data: emailData,
  });
}

module.exports = {
  handleOrderCreated,
};
