//list all the routers here

const profileRouter = require('../modules/profileMicroservice/routes');
const productRouter = require('../modules/productMicroservice/routes');
const orderRouter = require('../modules/orderMicroservice/routes');
const searchRouter = require('../modules/searchMicroservice/routes');
const adminRouter = require('../modules/adminMicroservice/routes');
const healthCheckRouter = require('./healthCheckRouter');

module.exports = {
  healthCheckRouter,
  profileRouter,
  productRouter,
  orderRouter,
  searchRouter,
  adminRouter,
};