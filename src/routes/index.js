//list all the routers here

const profileRouter = require('../modules/profileMicroservice/routes');
const productRouter = require('../modules/productMicroservice/routes');
const orderRouter = require('../modules/orderMicroservice/routes');
const staticRouter = require('./staticRouter');

module.exports = {
  profileRouter,
  productRouter,
  orderRouter,
  staticRouter,
};