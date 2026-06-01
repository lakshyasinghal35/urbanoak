const { mongoose } = require('../config/db');
const { Schema } = mongoose;

const COLLECTIONS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  SEARCH_OUTBOX: 'search_outbox',
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

const searchOutboxSchema = new Schema(
  {
    event_type: { type: String, required: true, index: true },
    product_id: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    last_error: { type: String, default: null },
  },
  { collection: COLLECTIONS.SEARCH_OUTBOX, timestamps: true }
);

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
const SearchOutboxModel = mongoose.models.SearchOutbox || mongoose.model('SearchOutbox', searchOutboxSchema);

async function ensureMongoIndexes() {
  await ProductModel.syncIndexes();
  await OrderModel.syncIndexes();
  await SearchOutboxModel.syncIndexes();
}

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

module.exports = {
  COLLECTIONS,
  ProductModel,
  OrderModel,
  SearchOutboxModel,
  ensureMongoIndexes,
  isDuplicateKeyError,
};
