//list all the routers here

const profileRouter = require('../modules/profileMicroservice/routes');
const productRouter = require('../modules/productMicroservice/routes');
const orderRouter = require('../modules/orderMicroservice/routes');
const searchRouter = require('../modules/searchMicroservice/routes');
const adminRouter = require('../modules/adminMicroservice/routes');
const staticRouter = require('./staticRouter');

module.exports = {
  profileRouter,
  productRouter,
  orderRouter,
  searchRouter,
  adminRouter,
  staticRouter,
};