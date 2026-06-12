const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const { authenticate } = require('../../common/middleware/auth');
const service = require('./service');

//--------------------------------order routes--------------------------------

router.post('/orders', authenticate, asyncHandler(async (req, res) => {
  const data = await service.saveOrder(req.body);
  sendSuccess(res, data, 201);
}));

router.put('/orders', asyncHandler(async (req, res) => {
  const data = await service.saveOrder(req.body);
  sendSuccess(res, data);
}));

router.get('/orders', authenticate, asyncHandler(async (req, res) => {
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

router.route('/cart-items')
    .all(authenticate)
    .post(asyncHandler(async (req, res) => {
        const data = await service.saveCartItem(req.body);
        sendSuccess(res, data, 201);
    }))
    .put(asyncHandler(async (req, res) => {
        const data = await service.saveCartItem(req.body);
        sendSuccess(res, data);
    }))
    .get(asyncHandler(async (req, res) => {
        const { id, user_id, cart_id } = req.query;
        const data = await service.fetchCartItem(id, user_id, cart_id);
        sendSuccess(res, data);
    }))
    .delete(asyncHandler(async (req, res) => {
        await service.removeCartItem(req.params.id);
        sendSuccess(res, { deleted: true });
    }));
    
module.exports = router;
