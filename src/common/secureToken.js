const crypto = require('crypto');

// Random, URL-safe secret handed to the user (inside the reset link).
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Only the hash is ever persisted, so a DB leak does not yield usable tokens.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateToken,
  hashToken,
};
