// MongoDB query helpers for orders; MySQL queries for carts and cart items

const { mongoose } = require('../../config/db');

//--------------------------------order--------------------------------

function orderDocument(order) {
  return {
    user_id: order.user_id,
    items: order.items,
    delivery_details: order.delivery_details,
    billing_details: order.billing_details,
    total_amount: order.total_amount,
    status: order.status,
  };
}

function orderByIdFilter(id) {
  return { _id: id };
}

function ordersByUserIdFilter(user_id) {
  return { user_id: Number(user_id) };
}

function toOrder(doc) {
  if (!doc) {
    return null;
  }

  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    user_id: obj.user_id,
    items: obj.items,
    delivery_details: obj.delivery_details,
    billing_details: obj.billing_details,
    total_amount: obj.total_amount,
    status: obj.status,
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

//--------------------------------cart--------------------------------

const createCartQuery = `
  INSERT INTO carts (user_id)
  VALUES (?);
`;

function cartParams(cart) {
  return [cart.user_id];
}

const deleteCartQuery = `
  DELETE FROM carts WHERE id = ?;
`;

const getCartByIdQuery = `
  SELECT * FROM carts WHERE id = ?;
`;

const getCartByUserIdQuery = `
  SELECT * FROM carts WHERE user_id = ?;
`;

//--------------------------------cart item--------------------------------

const createCartItemQuery = `
  INSERT INTO cart_items (cart_id, user_id, product_id, quantity)
  VALUES (?, ?, ?, ?);
`;

function cartItemParams(cartItem) {
  return [
    cartItem.cart_id,
    cartItem.user_id,
    cartItem.product_id,
    cartItem.quantity,
  ];
}

const saveCartItemQuery = `
  UPDATE cart_items
  SET cart_id = ?, user_id = ?, product_id = ?, quantity = ?
  WHERE id = ?;
`;

function saveCartItemParams(cartItem) {
  return [
    cartItem.cart_id,
    cartItem.user_id,
    cartItem.product_id,
    cartItem.quantity,
    cartItem.id,
  ];
}

const deleteCartItemQuery = `
  DELETE FROM cart_items WHERE id = ?;
`;

const getCartItemByIdQuery = `
  SELECT * FROM cart_items WHERE id = ?;
`;

const getCartItemsByUserIdQuery = `
  SELECT * FROM cart_items WHERE user_id = ?;
`;

const getCartItemsByCartIdQuery = `
  SELECT * FROM cart_items WHERE cart_id = ?;
`;

function isValidId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0;
}

module.exports = {
  orderDocument,
  orderByIdFilter,
  ordersByUserIdFilter,
  toOrder,
  isValidObjectId,
  createCartQuery,
  deleteCartQuery,
  getCartByIdQuery,
  getCartByUserIdQuery,
  cartParams,
  createCartItemQuery,
  saveCartItemQuery,
  deleteCartItemQuery,
  getCartItemByIdQuery,
  getCartItemsByUserIdQuery,
  getCartItemsByCartIdQuery,
  cartItemParams,
  saveCartItemParams,
  isValidId,
};
