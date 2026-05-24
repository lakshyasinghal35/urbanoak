//list all the routers here

const profileRouter = require('../modules/profileMicroservice/routes');
const productRouter = require('../modules/productMicroservice/routes');
const orderRouter = require('../modules/orderMicroservice/routes');

module.exports = {
  profileRouter,
  productRouter,
  orderRouter,
};