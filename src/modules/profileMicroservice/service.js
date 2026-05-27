const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('./repository');

const JWT_SECRET = process.env.JWT_SECRET || 'urbanoak-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const tokenBlacklist = new Set();



function sanitizeUser(user) {
  if (!user) return null;
  const { id, password, ...safeData } = user;
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

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

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
  fetchUser,
  fetchAllUsers,
  saveAddress,
  fetchAddressesByUserId
};
