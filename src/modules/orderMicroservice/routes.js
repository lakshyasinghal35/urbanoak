const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./service');

//--------------------------------order routes--------------------------------

router.post('/orders', asyncHandler(async (req, res) => {
  const data = await service.saveOrder(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/orders', asyncHandler(async (req, res) => {
  const data = await service.saveOrder(req.body);
  sendSuccess(res, data);
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const { id, user_id } = req.query;
  const data = await service.fetchOrder(id, user_id);
  sendSuccess(res, data);
}));

router.delete('/orders/:id', asyncHandler(async (req, res) => {
  await service.removeOrder(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------cart routes--------------------------------

router.post('/carts', asyncHandler(async (req, res) => {
  const data = await service.saveCart(req.body);
  sendSuccess(res, data, 201);
}));

router.get('/carts', asyncHandler(async (req, res) => {
  const { id, user_id } = req.query;
  const data = await service.fetchCart(id, user_id);
  sendSuccess(res, data);
}));

router.delete('/carts/:id', asyncHandler(async (req, res) => {
  await service.removeCart(req.params.id);
  sendSuccess(res, { deleted: true });
}));

//--------------------------------cart item routes--------------------------------

router.post('/cart-items', asyncHandler(async (req, res) => {
  const data = await service.saveCartItem(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/cart-items', asyncHandler(async (req, res) => {
  const data = await service.saveCartItem(req.body);
  sendSuccess(res, data);
}));

router.get('/cart-items', asyncHandler(async (req, res) => {
  const { id, user_id, cart_id } = req.query;
  const data = await service.fetchCartItem(id, user_id, cart_id);
  sendSuccess(res, data);
}));

router.delete('/cart-items/:id', asyncHandler(async (req, res) => {
  await service.removeCartItem(req.params.id);
  sendSuccess(res, { deleted: true });
}));

module.exports = router;
