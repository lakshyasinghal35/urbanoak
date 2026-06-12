const express = require('express');
const router = express.Router();
const service = require('./service');
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const { requireAdmin, requireSuperAdmin } = require('../../common/middleware/auth');


router.use('/admin', router);


// POST /admin/login - Authenticate an admin and issue a JWT
router.post('/login', asyncHandler(async (req, res) => {
  const data = await service.loginAdmin(req.body);
  sendSuccess(res, data);
}));

// POST /admin/change-password - Authenticated admin changes own password (old + new)
router.post('/change-password', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.changePassword(req.admin.id, req.body);
  sendSuccess(res, data);
}));

// POST /admins - Create a new admin user (superadmin only)
router.route('/')
    .post(...requireSuperAdmin, asyncHandler(async (req, res) => {
        const data = await service.createAdmin(req.body, req.admin.id);
        sendSuccess(res, data, 201);
    }))
    .put(...requireSuperAdmin, asyncHandler(async (req, res) => {
        const data = await service.updateAdmin(req.body);
        sendSuccess(res, data);
    }))
    .get(...requireAdmin, asyncHandler(async (req, res) => {
        const data = await service.fetchAdmins();
        sendSuccess(res, data);
    }));

module.exports = router;
