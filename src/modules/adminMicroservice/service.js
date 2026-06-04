const bcrypt = require('bcryptjs');
const adminRepository = require('./repository');
const ApiError = require('../../common/apiError');
const { signToken } = require('../../common/jwt');
const config = require('../../config/app.config.json');

const ALLOWED_ROLES = (config.admin && config.admin.allowed_roles) || ['superadmin', 'admin'];
const MIN_PASSWORD_LENGTH = (config.admin && config.admin.min_password_length) || 8;

function sanitizeAdmin(admin) {
  if (!admin) return null;
  const { password, ...safeData } = admin;
  return safeData;
}

async function loginAdmin({ email, password }) {
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const admin = await adminRepository.getAdminByEmail(email);
  if (!admin || !admin.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: admin.id, email: admin.email, role: admin.role });

  return {
    token,
    admin: sanitizeAdmin(admin),
  };
}

async function createAdmin(payload, createdBy) {
  const { name, email, password } = payload;
  if (!name || !email || !password) {
    throw ApiError.badRequest('Missing required fields: name, email, password');
  }

  const role = payload.role || 'admin';
  if (!ALLOWED_ROLES.includes(role)) {
    throw ApiError.badRequest(`Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
  }

  const existing = await adminRepository.getAdminByEmail(email);
  if (existing) {
    throw ApiError.conflict('An admin with this email already exists');
  }

  const now = new Date();
  const hashedPassword = await bcrypt.hash(password, 10);
  const created = await adminRepository.createAdmin({
    name,
    email,
    password: hashedPassword,
    role,
    is_active: payload.is_active ?? true,
    created_by: createdBy ?? null,
    created_at: now,
    updated_at: now,
  });

  return sanitizeAdmin(created);
}

async function updateAdmin(payload) {
  if (!payload.id) {
    throw ApiError.badRequest('Admin id is required');
  }

  const existing = await adminRepository.getAdminById(payload.id);
  if (!existing) {
    throw ApiError.notFound('Admin not found');
  }

  const role = payload.role ?? existing.role;
  if (!ALLOWED_ROLES.includes(role)) {
    throw ApiError.badRequest(`Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
  }

  const password = payload.password
    ? await bcrypt.hash(payload.password, 10)
    : existing.password;

  const updated = await adminRepository.updateAdmin({
    id: existing.id,
    name: payload.name ?? existing.name,
    password,
    role,
    is_active: payload.is_active ?? existing.is_active,
    updated_at: new Date(),
  });

  return sanitizeAdmin(updated);
}

async function fetchAdmins() {
  const admins = await adminRepository.getAllAdmins();
  return admins.map(sanitizeAdmin);
}

// Admins reset their own password by proving the current one (no email flow).
async function changePassword(adminId, { oldPassword, newPassword } = {}) {
  if (!oldPassword || !newPassword) {
    throw ApiError.badRequest('oldPassword and newPassword are required');
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (oldPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current password');
  }

  const admin = await adminRepository.getAdminById(adminId);
  if (!admin || !admin.is_active) {
    throw ApiError.unauthorized('Admin account not found or inactive');
  }

  const matches = await bcrypt.compare(oldPassword, admin.password);
  if (!matches) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await adminRepository.updatePassword(adminId, passwordHash);

  return { message: 'Password changed successfully' };
}

module.exports = {
  loginAdmin,
  createAdmin,
  updateAdmin,
  fetchAdmins,
  changePassword,
};
