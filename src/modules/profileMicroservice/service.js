const bcrypt = require('bcryptjs');
const userRepository = require('./repository');
const { signToken } = require('../../common/jwt');
const ApiError = require('../../common/apiError');
const { emailService } = require('../../common/email');
const { pushMessage } = require('../../common/events/messageProducer');
const {
  USER_PROFILE_EVENTS,
  getUserProfileEventsTopic,
} = require('../../common/events/eventTypes');
const { generateToken, hashToken } = require('../../common/secureToken');
const config = require('../../config');

const USER_PROFILE_EVENTS_TOPIC = getUserProfileEventsTopic();

const tokenBlacklist = new Set();

const MIN_PASSWORD_LENGTH = (config.passwordReset && config.passwordReset.min_password_length) || 8;



function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeData } = user;
  return safeData;
}

function sanitizeAddress(address) {
  if (!address) return null;
  const { id, user_id, ...safeData } = address;
  return safeData;
}


//--------------------------------user save and fetch operations--------------------------------


async function saveUser(user) {
  if (!user.email || !user.password || !user.firstname || !user.lastname) {
    throw new Error('Missing required fields: email, password, firstname, lastname');
  }

  const existingUser = await userRepository.getUserByEmail(user.email);
  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);
  const createdUser = await userRepository.createUser({
    ...user,
    password: hashedPassword,
    sign_up_date: new Date(),
  });

  publishUserProfileEventSafely({
    action: USER_PROFILE_EVENTS.SIGNED_UP,
    key: createdUser.id,
    payload: {
      id: createdUser.id,
      email: createdUser.email,
      firstname: createdUser.firstname,
      lastname: createdUser.lastname,
      action: USER_PROFILE_EVENTS.SIGNED_UP,
    },
    context: { userId: String(createdUser.id) },
  });

  return sanitizeUser(createdUser);
}



async function fetchUser(id, email) {
  if (!id && !email) {
    throw new Error('User ID or email is required');
  }

  const user = id
    ? await userRepository.getUserById(id)
    : await userRepository.getUserByEmail(email);

  return sanitizeUser(user);
}



async function fetchAllUsers() {
  const users = await userRepository.getAllUsers();
  return users.map(sanitizeUser);
}




//--------------------------------user login and logout operations--------------------------------

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new Error('Invalid email or password');
  }

  const token = signToken({ id: user.id, email: user.email });

  return {
    token,
    user: sanitizeUser(user),
  };
}

//TODO: Implement proper logout logic
function logoutUser(token) {
  if (!token) {
    throw new Error('Token is required for logout');
  }

  tokenBlacklist.add(token);
  return true;
}

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}


//--------------------------------password reset (email link)--------------------------------

function buildResetLink(token) {
  const base = config.passwordReset && config.passwordReset.url_base;
  if (!base) {
    return null;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

// Step 1: user requests a reset. Always returns the same response whether or not
// the email exists, to avoid leaking which emails are registered.
async function requestPasswordReset(email) {
  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await userRepository.getUserByEmail(email);
  if (user) {
    // Keep only the latest token valid.
    await userRepository.deleteUnusedPasswordResetTokens(user.id);

    const token = generateToken();
    const ttlMinutes = (config.passwordReset && config.passwordReset.token_ttl_minutes) || 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await userRepository.createPasswordResetToken({
      user_id: user.id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    });

    await emailService.send({
      to: user.email,
      template: 'resetPassword',
      data: {
        firstname: user.firstname,
        resetUrl: buildResetLink(token) || token,
        expiryMinutes: ttlMinutes,
      },
    });
  }

  return { message: 'If an account exists for that email, a password reset link has been sent.' };
}

// Step 2: user submits the token + a new password.
async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    throw ApiError.badRequest('Token and new password are required');
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const tokenRow = await userRepository.getPasswordResetTokenByHash(hashToken(token));
  const isValid = tokenRow
    && !tokenRow.used_at
    && new Date(tokenRow.expires_at) > new Date();
  if (!isValid) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = await userRepository.getUserById(tokenRow.user_id);
  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updateUserPassword(tokenRow.user_id, passwordHash);

  // Single-use: consume this token and drop any other outstanding ones.
  await userRepository.markPasswordResetTokenUsed(tokenRow.id);
  await userRepository.deleteUnusedPasswordResetTokens(tokenRow.user_id);

  await publishUserProfileEventSafely({
    action: USER_PROFILE_EVENTS.PASSWORD_RESET_COMPLETED,
    key: user.id,
    payload: {
      user_id: user.id,
      email: user.email,
      firstname: user.firstname,
      action: USER_PROFILE_EVENTS.PASSWORD_RESET_COMPLETED,
    },
    context: { userId: String(user.id) },
  });

  return { message: 'Password has been reset. Please sign in with your new password.' };
}



async function publishUserProfileEventSafely({ action, key, payload, context = {} }) {
  try {
    await pushMessage({
      topic: USER_PROFILE_EVENTS_TOPIC,
      key,
      payload,
      context: {
        action,
        ...context,
      },
    });
  } catch (error) {
    console.error('[user-profile-events] publish failed in service layer', {
      action,
      ...context,
      error: error.message,
    });
  }
}

//--------------------------------address save and fetch operations--------------------------------


async function saveAddress(address) {
  if (!address.mobile || !address.house_no || !address.area || !address.city || !address.state || !address.country || !address.pincode) {
    throw new Error('Missing required fields: mobile, house_no, area, landmark, city, state, country, pincode');
  }

  const createdAddress = await userRepository.createAddress(address);
  return sanitizeAddress(createdAddress);
}


async function fetchAddressesByUserId(user_id) {
  const addresses = await userRepository.getAddressesByUserId(user_id);
  return (addresses || []).map(sanitizeAddress);
}




module.exports = {
  saveUser,
  loginUser,
  logoutUser,
  isTokenBlacklisted,
  requestPasswordReset,
  resetPassword,
  fetchUser,
  fetchAllUsers,
  saveAddress,
  fetchAddressesByUserId
};
