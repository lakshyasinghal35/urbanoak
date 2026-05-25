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

module.exports = {
  createUserQuery,
  getUserByIdQuery,
  getUserByEmailQuery,
  getAllUsersQuery,
  createAddressQuery,
  getAddressesByUserIdQuery,
  userParams,
  addressParams,
};