const express = require('express');
const router = express.Router();
const service = require('./service');
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const { authenticate, authorize } = require('../../common/middleware/auth');

// POST /users - Create a new user
router.route('/users')
    .post(asyncHandler(async (req, res) => {
        const data = await service.saveUser(req.body);
        sendSuccess(res, data, 201);
    }))
    .get(asyncHandler(async (req, res) => {
        const { id, email } = req.query;
        const data = await service.fetchUser(id, email);
        sendSuccess(res, data);
    }));




// GET /users/all - Get all users
router.get('/users/all', asyncHandler(async (req, res) => {
    const data = await service.fetchAllUsers();
    sendSuccess(res, data);
}));

//--------------------------------account management--------------------------------

//create login route
router.post('/login', asyncHandler(async (req, res) => {
    const data = await service.loginUser(req.body);
    sendSuccess(res, data);
}));

//create logout route
router.post('/logout', asyncHandler(async (req, res) => {
    const data = await service.logoutUser(req.body.token);
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


//--------------------------------address--------------------------------


// POST /address - Create a new address
router.post('/addresses', authenticate, asyncHandler(async (req, res) => {
    const data = await service.saveAddress(req.body);
    sendSuccess(res, data, 201);
}));

// GET /address/:user_id - Get addresses by user ID
router.get('/addresses/:user_id', authenticate, asyncHandler(async (req, res) => {
    const user_id = req.params.user_id;
    const data = await service.fetchAddressesByUserId(user_id);
    sendSuccess(res, data);
}));


module.exports = router;
