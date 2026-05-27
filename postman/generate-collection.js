/**
 * Generates postman/urbanoak.postman_collection.json from route definitions.
 * Run: node postman/generate-collection.js
 */

const fs = require('fs');
const path = require('path');

const COLLECTION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function jsonBody(obj) {
  return {
    mode: 'raw',
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: 'json' } },
  };
}

function headersJson() {
  return [{ key: 'Content-Type', value: 'application/json' }];
}

function url(path, query = []) {
  const rawPath = path.startsWith('/') ? path : `/${path}`;
  const full = `{{baseUrl}}${rawPath}`;
  const segments = rawPath.split('/').filter(Boolean);
  const item = {
    raw: full,
    host: ['{{baseUrl}}'],
    path: segments,
  };
  if (query.length) {
    item.query = query;
  }
  return item;
}

function request(name, method, path, opts = {}) {
  const req = {
    method,
    header: opts.json !== false && ['POST', 'PUT', 'PATCH'].includes(method) ? headersJson() : [],
    url: typeof path === 'string' ? url(path, opts.query) : path,
  };
  if (opts.body !== undefined) {
    req.body = jsonBody(opts.body);
  }
  if (opts.description) {
    req.description = opts.description;
  }
  return { name, request: req, response: [] };
}

function folder(name, description, items) {
  return { name, description, item: items };
}

const collection = {
  info: {
    _postman_id: COLLECTION_ID,
    name: 'urbanoak API',
    description:
      'E-commerce furniture store API (Express). Import with environment `urbanoak — local`. Start server: `npm run dev` (port 9000).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [{ key: 'baseUrl', value: 'http://localhost:9000' }],
  item: [
    folder('Health', 'Server status', [
      request('Health check', 'GET', '/', {
        json: false,
        description: 'Returns app name, status, and API base path.',
      }),
    ]),
    folder('Profile', 'Users and addresses (MySQL)', [
      request('Create user', 'POST', '/api/users', {
        body: {
          email: 'jane.doe@example.com',
          password: 'secret123',
          mobile: '9876543210',
          firstname: 'Jane',
          lastname: 'Doe',
          age: 28,
        },
        description: 'Required: email, password, firstname, lastname. DB also expects mobile and age.',
      }),
      request('Get user by id', 'GET', '/api/users', {
        query: [{ key: 'id', value: '{{userId}}', description: 'User id' }],
        description: 'Provide `id` or `email` query param.',
      }),
      request('Get user by email', 'GET', '/api/users', {
        query: [{ key: 'email', value: 'jane.doe@example.com' }],
      }),
      request('Get all users', 'GET', '/api/users/all'),
      request('Create address', 'POST', '/api/addresses', {
        body: {
          user_id: 1,
          mobile: '9876543210',
          house_no: '12A',
          area: 'Downtown',
          landmark: 'Near park',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001',
        },
      }),
      request('Get addresses by user', 'GET', '/api/addresses/{{userId}}'),
    ]),
    folder('Product', 'Catalog: spaces, categories, sections, products', [
      folder('Spaces', null, [
        request('Create space', 'POST', '/api/spaces', { body: { name: 'Living Room' } }),
        request('Update space', 'PUT', '/api/spaces', { body: { id: 1, name: 'Living Room' } }),
        request('Get space by id', 'GET', '/api/spaces', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get space by name', 'GET', '/api/spaces', {
          query: [{ key: 'name', value: 'Living Room' }],
        }),
        request('Get all spaces', 'GET', '/api/spaces/all'),
        request('Delete space', 'DELETE', '/api/spaces/1'),
      ]),
      folder('Categories', null, [
        request('Create category', 'POST', '/api/categories', { body: { name: 'Sofas' } }),
        request('Update category', 'PUT', '/api/categories', { body: { id: 1, name: 'Sofas' } }),
        request('Get category by id', 'GET', '/api/categories', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get category by name', 'GET', '/api/categories', {
          query: [{ key: 'name', value: 'Sofas' }],
        }),
        request('Get all categories', 'GET', '/api/categories/all'),
        request('Delete category', 'DELETE', '/api/categories/1'),
      ]),
      folder('Sections', null, [
        request('Create section', 'POST', '/api/sections', {
          body: { space_id: 1, category_id: 1 },
        }),
        request('Update section', 'PUT', '/api/sections', {
          body: { id: 1, space_id: 1, category_id: 1 },
        }),
        request('Get section by id', 'GET', '/api/sections', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get sections by space', 'GET', '/api/sections', {
          query: [{ key: 'space_id', value: '1' }],
        }),
        request('Get all sections', 'GET', '/api/sections/all'),
        request('Delete section', 'DELETE', '/api/sections/1'),
      ]),
      folder('Products', null, [
        request('Create product', 'POST', '/api/products', {
          body: {
            title: 'Oak Study Desk',
            category_id: 1,
            category: 'Desks',
            wood_type: 'oak',
            dimensions: '120x60x75 cm',
            mrp: 15000,
            discount: 10,
            images: ['https://example.com/desk.jpg'],
            details: 'Solid oak desk',
            units: 50,
          },
        }),
        request('Update product', 'PUT', '/api/products', {
          body: {
            id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            title: 'Oak Study Desk',
            category_id: 1,
            mrp: 14000,
            discount: 15,
          },
        }),
        request('Get product by id', 'GET', '/api/products', {
          query: [{ key: 'id', value: 'REPLACE_WITH_MONGO_PRODUCT_ID' }],
        }),
        request('Get products by categories', 'GET', '/api/products', {
          query: [{ key: 'category_ids', value: '1,2' }],
        }),
        request('List products (paginated)', 'GET', '/api/products/list', {
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
          ],
        }),
        request('Delete product', 'DELETE', '/api/products/REPLACE_WITH_MONGO_PRODUCT_ID'),
      ]),
    ]),
    folder('Order', 'Orders, carts, cart items (MongoDB + MySQL carts)', [
      folder('Orders', null, [
        request('Create order', 'POST', '/api/orders', {
          body: {
            user_id: 1,
            items: [{ product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID', quantity: 1, price: 13500 }],
            delivery_details: {
              delivery_address: {
                house_no: '12A',
                city: 'Mumbai',
                pincode: '400001',
              },
              tracking_details: {},
            },
            billing_details: { payment_method: 'card' },
            total_amount: 13500,
            status: 'pending',
          },
          description: 'Order ids are MongoDB ObjectIds on update/delete.',
        }),
        request('Update order', 'PUT', '/api/orders', {
          body: {
            id: '{{orderId}}',
            user_id: 1,
            items: [{ product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID', quantity: 2 }],
            delivery_details: { delivery_address: {}, tracking_details: {} },
            billing_details: {},
            total_amount: 27000,
            status: 'confirmed',
          },
        }),
        request('Get order by id', 'GET', '/api/orders', {
          query: [{ key: 'id', value: '{{orderId}}' }],
        }),
        request('Get orders by user', 'GET', '/api/orders', {
          query: [{ key: 'user_id', value: '{{userId}}' }],
        }),
        request('Delete order', 'DELETE', '/api/orders/{{orderId}}'),
      ]),
      folder('Carts', null, [
        request('Create cart', 'POST', '/api/carts', { body: { user_id: 1 } }),
        request('Get cart by id', 'GET', '/api/carts', {
          query: [{ key: 'id', value: '{{cartId}}' }],
        }),
        request('Get cart by user', 'GET', '/api/carts', {
          query: [{ key: 'user_id', value: '{{userId}}' }],
        }),
        request('Delete cart', 'DELETE', '/api/carts/{{cartId}}'),
      ]),
      folder('Cart items', null, [
        request('Create cart item', 'POST', '/api/cart-items', {
          body: {
            user_id: 1,
            product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            quantity: 1,
          },
          description: 'Creates cart for user if missing.',
        }),
        request('Update cart item', 'PUT', '/api/cart-items', {
          body: {
            id: 1,
            user_id: 1,
            cart_id: 1,
            product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            quantity: 2,
          },
        }),
        request('Get cart item by id', 'GET', '/api/cart-items', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get cart items by user', 'GET', '/api/cart-items', {
          query: [{ key: 'user_id', value: '{{userId}}' }],
        }),
        request('Get cart items by cart', 'GET', '/api/cart-items', {
          query: [{ key: 'cart_id', value: '{{cartId}}' }],
        }),
        request('Delete cart item', 'DELETE', '/api/cart-items/1'),
      ]),
    ]),
  ],
};

const outPath = path.join(__dirname, 'urbanoak.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2) + '\n');
console.log('Wrote', outPath);
