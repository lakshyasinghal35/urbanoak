//write all the queries for the profile microservice

const createUserQuery = `
  INSERT INTO users (email, password, mobile, firstname, lastname, age, sign_up_date)
  VALUES (?, ?, ?, ?, ?, ?, ?);
`;

function userParams(user) {
  return [
    user.email,
    user.password,
    user.mobile,
    user.firstname,
    user.lastname,
    user.age,
    user.sign_up_date,
  ];
}

const getUserByIdQuery = `
  SELECT * FROM users WHERE id = ?;
`;

const getUserByEmailQuery = `
  SELECT * FROM users WHERE email = ?;
`;

//get all users
const getAllUsersQuery = `
  SELECT * FROM users;
`;

//create address
const createAddressQuery = `
  INSERT INTO addresses (user_id, mobile, house_no, area, landmark, city, state, country, pincode)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

function addressParams(address) {
  return [
    address.user_id,
    address.mobile,
    address.house_no,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.country,
    address.pincode,
  ];
}

//get addresses by user id
const getAddressesByUserIdQuery = `
  SELECT * FROM addresses WHERE user_id = ?;    
`;

//--------------------------------password reset--------------------------------

const updateUserPasswordQuery = `
  UPDATE users SET password = ? WHERE id = ?;
`;

const createPasswordResetTokenQuery = `
  INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
  VALUES (?, ?, ?, ?);
`;

const getPasswordResetTokenByHashQuery = `
  SELECT * FROM password_reset_tokens WHERE token_hash = ?;
`;

const markPasswordResetTokenUsedQuery = `
  UPDATE password_reset_tokens SET used_at = ? WHERE id = ?;
`;

// Invalidate any other outstanding (unused) tokens for a user so only the most
// recent request is ever valid.
const deleteUnusedPasswordResetTokensQuery = `
  DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL;
`;

module.exports = {
  createUserQuery,
  getUserByIdQuery,
  getUserByEmailQuery,
  getAllUsersQuery,
  createAddressQuery,
  getAddressesByUserIdQuery,
  updateUserPasswordQuery,
  createPasswordResetTokenQuery,
  getPasswordResetTokenByHashQuery,
  markPasswordResetTokenUsedQuery,
  deleteUnusedPasswordResetTokensQuery,
  userParams,
  addressParams,
};