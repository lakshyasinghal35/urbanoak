const repository = require('./repository');
const ApiError = require('../../common/apiError');
const { pushMessage } = require('../../common/messageProducer');
const config = require('../../config/app.config.json');
const { getPayload } = require('./model/order');

const KAFKA_CONFIG = config.kafka || {};
const ORDER_EVENTS_TOPIC = KAFKA_CONFIG.topic?.order_events || 'order_events';
const ORDER_EVENT_TYPES = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
};

//--------------------------------order--------------------------------

async function saveOrder(order) {
  if (!order.user_id || !order.items || !order.delivery_details || !order.billing_details || order.total_amount == null) {
    throw ApiError.badRequest('Missing required order fields: user_id, items, delivery_details, billing_details, total_amount');
  }

  if (order.id) {
    const updatedOrder = await repository.saveOrder(order);
    if (!updatedOrder) {
      throw ApiError.notFound('Order not found');
    }

    await publishOrderEventSafely('updated', updatedOrder);
    return updatedOrder;
  }

  const createdOrder = await repository.createOrder(order);
  await publishOrderEventSafely('created', createdOrder);
  return createdOrder;
}

async function publishOrderEventSafely(eventType, order) {
  try {
    const normalizedEventType = eventType === 'created'
      ? ORDER_EVENT_TYPES.CREATED
      : ORDER_EVENT_TYPES.UPDATED;

    await pushMessage({
      topic: ORDER_EVENTS_TOPIC,
      key: String(order.id),
      payload: getPayload(order, normalizedEventType),
      context: {
        orderId: String(order.id),
      },
    });
  } catch (error) {
    // Best-effort strategy: keep order API successful even if messaging fails.
    console.error('[order-events] publish failed in service layer', {
      eventType,
      orderId: String(order?.id || ''),
      error: error.message,
    });
  }
}

async function fetchOrder(id, user_id) {
  if (!id && !user_id) {
    throw ApiError.badRequest('Order id or user_id is required');
  }

  return id ? repository.getOrderById(id) : repository.getOrdersByUserId(user_id);
}

async function removeOrder(id) {
  if (!id) {
    throw ApiError.badRequest('Order id is required');
  }

  const deleted = await repository.deleteOrder(id);
  if (!deleted) {
    throw ApiError.notFound('Order not found');
  }

  return true;
}

//--------------------------------cart--------------------------------

async function saveCart(cart) {
  if (!cart.user_id) {
    throw ApiError.badRequest('Cart user_id is required');
  }

  if (cart.id) {
    throw ApiError.badRequest('Cart update is not supported');
  }

  const existingCart = await repository.getCartByUserId(cart.user_id);
  if (existingCart) {
    throw ApiError.conflict('Cart already exists for this user');
  }

  return repository.createCart(cart);
}

async function fetchCart(id, user_id) {
  if (!id && !user_id) {
    throw ApiError.badRequest('Cart id or user_id is required');
  }

  const cart = id ? await repository.getCartById(id) : await repository.getCartByUserId(user_id);
  if (!cart) {
    return null;
  }

  const items = await repository.getCartItemsByCartId(cart.id);
  return {
    ...cart,
    items: items || [],
  };
}

async function removeCart(id) {
  if (!id) {
    throw ApiError.badRequest('Cart id is required');
  }

  const deleted = await repository.deleteCart(id);
  if (!deleted) {
    throw ApiError.notFound('Cart not found');
  }

  return true;
}

//--------------------------------cart item--------------------------------

async function saveCartItem(cartItem) {
  if (!cartItem.user_id || !cartItem.product_id || cartItem.quantity == null) {
    throw ApiError.badRequest('Missing required cart item fields: user_id, product_id, quantity');
  }

  if (!cartItem.cart_id) {
    let cart = await repository.getCartByUserId(cartItem.user_id);
    if (!cart) {
      cart = await repository.createCart({ user_id: cartItem.user_id });
    }
    cartItem.cart_id = cart.id;
  }

  return cartItem.id ? repository.saveCartItem(cartItem) : repository.createCartItem(cartItem);
}

async function fetchCartItem(id, user_id, cart_id) {
  if (!id && !user_id && !cart_id) {
    throw ApiError.badRequest('Cart item id, user_id, or cart_id is required');
  }

  if (id) {
    return repository.getCartItemById(id);
  }

  return user_id
    ? repository.getCartItemsByUserId(user_id)
    : repository.getCartItemsByCartId(cart_id);
}

async function removeCartItem(id) {
  if (!id) {
    throw ApiError.badRequest('Cart item id is required');
  }

  const deleted = await repository.deleteCartItem(id);
  if (!deleted) {
    throw ApiError.notFound('Cart item not found');
  }

  return true;
}

module.exports = {
  saveOrder,
  fetchOrder,
  removeOrder,
  saveCart,
  fetchCart,
  removeCart,
  saveCartItem,
  fetchCartItem,
  removeCartItem,
};
