const repository = require('./repository');
const ApiError = require('../../common/apiError');
const { pushMessage } = require('../../common/messageProducer');
const config = require('../../config/app.config.json');
const { getPayload } = require('./model/order');
const productService = require('../productMicroservice/service');
const productRepository = require('../productMicroservice/repository');

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

  const reservedItems = await reserveInventoryForOrder(order.items);
  let createdOrder;
  try {
    createdOrder = await repository.createOrder(order);
  } catch (error) {
    await rollbackInventory(reservedItems);
    throw error;
  }

  await publishOrderEventSafely('created', createdOrder);
  return createdOrder;
}

/**
 * normalizeOrderItems
 * Aggregates and validates the items in an order.
 * - Ensures the items array is present and not empty.
 * - Groups items by product_id summing their quantities.
 * - Throws errors for missing product_id, or invalid quantities.
 * - Returns an array of items in canonical order by product_id.
 *
 * @param {Array} items - The raw items from an order.
 * @returns {Array} Normalized and aggregated order items.
 */
function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Order must contain at least one item');
  }

  const aggregatedItems = new Map();
  for (const item of items) {
    if (!item || !item.product_id) {
      throw ApiError.badRequest('Each order item must include product_id');
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ApiError.badRequest(`Invalid quantity for product_id ${item.product_id}`);
    }

    const productId = String(item.product_id);
    const existing = aggregatedItems.get(productId) || 0;
    aggregatedItems.set(productId, existing + quantity);
  }

  return [...aggregatedItems.entries()]
    .map(([product_id, quantity]) => ({ product_id, quantity }))
    .sort((a, b) => a.product_id.localeCompare(b.product_id));
}

/**
 * reserveInventoryForOrder
 * Attempts to reserve inventory for each item in the order.
 * - Uses normalizeOrderItems to aggregate and validate order items.
 * - For each item, tries to decrement inventory via productService.
 * - If inventory is insufficient for any item, rolls back all previous reservations and throws a conflict error with details.
 * - Returns an array of the reserved items if inventory is successfully reserved for all.
 *
 * @param {Array} items - The order items to reserve inventory for.
 * @returns {Promise<Array>} The list of reserved items.
 * @throws {ApiError} If inventory is insufficient or order items are invalid.
 */
async function reserveInventoryForOrder(items) {
  const normalizedItems = normalizeOrderItems(items);
  const reservedItems = [];

  for (const item of normalizedItems) {
    const updatedProduct = await productService.decrementProductInventoryIfAvailable(
      item.product_id,
      item.quantity
    );

    if (!updatedProduct) {
      await rollbackInventory(reservedItems);
      const productInventory = await productRepository.getProductUnitsById(item.product_id);
      const availableUnits = productInventory ? productInventory.units : 0;
      throw ApiError.conflict('Insufficient inventory', {
        shortages: [
          {
            product_id: item.product_id,
            requested: item.quantity,
            available: availableUnits,
          },
        ],
      });
    }

    reservedItems.push(item);
  }

  return reservedItems;
}

async function rollbackInventory(reservedItems) {
  if (!Array.isArray(reservedItems) || reservedItems.length === 0) {
    return;
  }

  for (let i = reservedItems.length - 1; i >= 0; i -= 1) {
    const item = reservedItems[i];
    try {
      await productService.incrementProductInventory(item.product_id, item.quantity);
    } catch (error) {
      console.error('[order-inventory] rollback failed', {
        productId: item.product_id,
        quantity: item.quantity,
        error: error.message,
      });
    }
  }
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
