const { pool } = require('../../config/db');
const User = require('./model/user');
const Address = require('./model/address');
const queries = require('./query');

async function createUser(user) {
  const sql = queries.createUserQuery;

  const [result] = await pool.execute(sql, queries.userParams(user));

  return new User({
    id: result.insertId,
    ...user
  });
}

async function getUserById(id) {
  const sql = queries.getUserByIdQuery;

  const [rows] = await pool.execute(sql, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new User(rows[0]);
}

async function getUserByEmail(email) {
  const sql = queries.getUserByEmailQuery;

  const [rows] = await pool.execute(sql, [email]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return new User(rows[0]);
}

async function getAllUsers() {
  const sql = queries.getAllUsersQuery;

  const [rows] = await pool.execute(sql);
  return rows.map(row => new User(row));
}


//create address
async function createAddress(address) {
  const sql = queries.createAddressQuery;
  const [result] = await pool.execute(sql, queries.addressParams(address));
  return new Address({
    id: result.insertId,
    ...address
  });
}

//get address by user id
async function getAddressesByUserId(user_id) {
  const sql = queries.getAddressesByUserIdQuery;

  const [rows] = await pool.execute(sql, [user_id]);
  if (!rows || rows.length === 0) {
    return null;
  }

  return rows.map(row => new Address(row));
}


//--------------------------------password reset--------------------------------

async function updateUserPassword(id, passwordHash) {
  await pool.execute(queries.updateUserPasswordQuery, [passwordHash, id]);
  return getUserById(id);
}

async function createPasswordResetToken({ user_id, token_hash, expires_at }) {
  const [result] = await pool.execute(queries.createPasswordResetTokenQuery, [
    user_id,
    token_hash,
    expires_at,
    new Date(),
  ]);
  return result.insertId;
}

async function getPasswordResetTokenByHash(token_hash) {
  const [rows] = await pool.execute(queries.getPasswordResetTokenByHashQuery, [token_hash]);
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[0];
}

async function markPasswordResetTokenUsed(id) {
  await pool.execute(queries.markPasswordResetTokenUsedQuery, [new Date(), id]);
}

async function deleteUnusedPasswordResetTokens(user_id) {
  await pool.execute(queries.deleteUnusedPasswordResetTokensQuery, [user_id]);
}



module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  createAddress,
  getAddressesByUserId,
  updateUserPassword,
  createPasswordResetToken,
  getPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  deleteUnusedPasswordResetTokens,
};
