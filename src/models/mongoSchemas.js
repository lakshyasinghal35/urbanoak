const { mongoose } = require('../config/db');
const { Schema } = mongoose;

const COLLECTIONS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
};

const productSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    category_id: { type: Number, required: true, index: true },
    category: { type: String, required: true },
    wood_type: { type: String },
    dimensions: { type: String },
    mrp: { type: Number, required: true },
    discount: { type: Number },
    images: { type: [Schema.Types.Mixed] },
    details: { type: Object },
    units: { type: Number, required: true },
  },
  { collection: COLLECTIONS.PRODUCTS, timestamps: true }
);

const orderSchema = new Schema(
  {
    user_id: { type: Number, required: true, index: true },
    items: { type: Schema.Types.Mixed, required: true },
    delivery_details: { type: Schema.Types.Mixed, required: true },
    billing_details: { type: Schema.Types.Mixed, required: true },
    total_amount: { type: Number, required: true },
    status: { type: String },
  },
  { collection: COLLECTIONS.ORDERS, timestamps: true }
);

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function ensureMongoIndexes() {
  await ProductModel.syncIndexes();
  await OrderModel.syncIndexes();
}

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

module.exports = {
  COLLECTIONS,
  ProductModel,
  OrderModel,
  ensureMongoIndexes,
  isDuplicateKeyError,
};
