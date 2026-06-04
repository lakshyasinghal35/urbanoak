const express = require('express');
const router = express.Router();
const service = require('./service');
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');

// POST /users - Create a new user
router.post('/users', asyncHandler(async (req, res) => {
    const data = await service.saveUser(req.body);
    sendSuccess(res, data, 201);
}));

// GET /users - Get user by ID or email
router.get('/users', asyncHandler(async (req, res) => {
    const { id, email } = req.query;
    const data = await service.fetchUser(id, email);
    sendSuccess(res, data);
}));

// GET /users/all - Get all users
router.get('/users/all', asyncHandler(async (req, res) => {
    const data = await service.fetchAllUsers();
    sendSuccess(res, data);
}));

// POST /users/forgot-password - Request a password reset email link
router.post('/users/forgot-password', asyncHandler(async (req, res) => {
    const data = await service.requestPasswordReset(req.body.email);
    sendSuccess(res, data);
}));

// POST /users/reset-password - Reset the password using the emailed token
router.post('/users/reset-password', asyncHandler(async (req, res) => {
    const data = await service.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, data);
}));

// POST /address - Create a new address
router.post('/addresses', asyncHandler(async (req, res) => {
    const data = await service.saveAddress(req.body);
    sendSuccess(res, data, 201);
}));

// GET /address/:user_id - Get addresses by user ID
router.get('/addresses/:user_id', asyncHandler(async (req, res) => {
    const user_id = req.params.user_id;
    const data = await service.fetchAddressesByUserId(user_id);
    sendSuccess(res, data);
}));


module.exports = router;
