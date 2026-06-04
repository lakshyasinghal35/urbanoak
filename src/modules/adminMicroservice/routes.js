const express = require('express');
const router = express.Router();
const service = require('./service');
const { sendSuccess } = require('../../common/response');
const asyncHandler = require('../../common/asyncHandler');
const { requireAdmin, requireSuperAdmin } = require('../../common/middleware/auth');

// POST /admin/login - Authenticate an admin and issue a JWT
router.post('/admin/login', asyncHandler(async (req, res) => {
  const data = await service.loginAdmin(req.body);
  sendSuccess(res, data);
}));

// POST /admins - Create a new admin user (superadmin only)
router.post('/admins', ...requireSuperAdmin, asyncHandler(async (req, res) => {
  const data = await service.createAdmin(req.body, req.admin.id);
  sendSuccess(res, data, 201);
}));

// PUT /admins - Update an existing admin user (superadmin only)
router.put('/admins', ...requireSuperAdmin, asyncHandler(async (req, res) => {
  const data = await service.updateAdmin(req.body);
  sendSuccess(res, data);
}));

// GET /admins - List all admin users (any admin)
router.get('/admins', ...requireAdmin, asyncHandler(async (req, res) => {
  const data = await service.fetchAdmins();
  sendSuccess(res, data);
}));

module.exports = router;
