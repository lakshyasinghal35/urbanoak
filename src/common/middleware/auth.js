const ApiError = require('../apiError');
const { verifyToken } = require('../jwt');

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

function authenticate(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Authorization token is required'));
  }

  try {
    req.admin = verifyToken(token);
    return next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    const role = req.admin && req.admin.role;
    if (!role || !allowedRoles.includes(role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

const requireAdmin = [authenticate, authorize('admin', 'superadmin')];
const requireSuperAdmin = [authenticate, authorize('superadmin')];

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireSuperAdmin,
};
