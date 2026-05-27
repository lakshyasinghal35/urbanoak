const { pool } = require('../../config/db');
const Order = require('./model/order');
const { Cart, CartItem } = require('./model/cart');
const queries = require('./query');
const { OrderModel } = require('../../models/mongoSchemas');

//--------------------------------order--------------------------------

async function createOrder(order) {
  const doc = await OrderModel.create(queries.orderDocument(order));
  return new Order(queries.toOrder(doc));
}

async function saveOrder(order) {
  if (!queries.isValidObjectId(order.id)) {
    return null;
  }

  const doc = await OrderModel.findByIdAndUpdate(
    order.id,
    queries.orderDocument(order),
    { new: true }
  );

  if (!doc) {
    return null;
  }

  return new Order(queries.toOrder(doc));
}

async function deleteOrder(id) {
  if (!queries.isValidObjectId(id)) {
    return false;
  }

  const doc = await OrderModel.findByIdAndDelete(id);
  return doc != null;
}

async function getOrderById(id) {
  if (!queries.isValidObjectId(id)) {
    return null;
  }

  const doc = await OrderModel.findById(id);
  if (!doc) {
    return null;
  }

  return new Order(queries.toOrder(doc));
}

async function getOrdersByUserId(user_id) {
  const docs = await OrderModel.find(queries.ordersByUserIdFilter(user_id));
  if (!docs || docs.length === 0) {
    return null;
  }

  return docs.map(doc => new Order(queries.toOrder(doc)));
}

//--------------------------------cart--------------------------------

async function createCart(cart) {
  const [result] = await pool.execute(queries.createCartQuery, queries.cartParams(cart));

  return new Cart({
    id: result.insertId,
    user_id: cart.user_id,
  });
}

async function deleteCart(id) {
  if (!queries.isValidId(id)) {
    return false;
  }

  const [result] = await pool.execute(queries.deleteCartQuery, [id]);
  return result.affectedRows > 0;
}

async function getCartById(id) {
  if (!queries.isValidId(id)) {
    return null;
  }

  const [rows] = await pool.execute(queries.getCartByIdQuery, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Cart(rows[0]);
}

async function getCartByUserId(user_id) {
  const [rows] = await pool.execute(queries.getCartByUserIdQuery, [user_id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new Cart(rows[0]);
}

//--------------------------------cart item--------------------------------

async function createCartItem(cartItem) {
  const [result] = await pool.execute(
    queries.createCartItemQuery,
    queries.cartItemParams(cartItem)
  );

  return new CartItem({
    id: result.insertId,
    ...cartItem,
  });
}

async function saveCartItem(cartItem) {
  if (!queries.isValidId(cartItem.id)) {
    return null;
  }

  const [result] = await pool.execute(
    queries.saveCartItemQuery,
    queries.saveCartItemParams(cartItem)
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return new CartItem(cartItem);
}

async function deleteCartItem(id) {
  if (!queries.isValidId(id)) {
    return false;
  }

  const [result] = await pool.execute(queries.deleteCartItemQuery, [id]);
  return result.affectedRows > 0;
}

async function getCartItemById(id) {
  if (!queries.isValidId(id)) {
    return null;
  }

  const [rows] = await pool.execute(queries.getCartItemByIdQuery, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new CartItem(rows[0]);
}

async function getCartItemsByUserId(user_id) {
  const [rows] = await pool.execute(queries.getCartItemsByUserIdQuery, [user_id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return rows.map(row => new CartItem(row));
}

async function getCartItemsByCartId(cart_id) {
  if (!queries.isValidId(cart_id)) {
    return null;
  }

  const [rows] = await pool.execute(queries.getCartItemsByCartIdQuery, [cart_id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return rows.map(row => new CartItem(row));
}

module.exports = {
  createOrder,
  saveOrder,
  deleteOrder,
  getOrderById,
  getOrdersByUserId,
  createCart,
  deleteCart,
  getCartById,
  getCartByUserId,
  createCartItem,
  saveCartItem,
  deleteCartItem,
  getCartItemById,
  getCartItemsByUserId,
  getCartItemsByCartId,
};
