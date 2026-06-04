const jwt = require('jsonwebtoken');
const config = require('../config/app.config.json');

const JWT_SECRET = process.env.JWT_SECRET || (config.jwt && config.jwt.secret) || 'urbanoak-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (config.jwt && config.jwt.expires_in) || '1h';

function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
