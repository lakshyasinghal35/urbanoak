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

function requestHeaders(method, opts = {}) {
  const headers = [];
  if (
    opts.json !== false &&
    opts.formdata === undefined &&
    ['POST', 'PUT', 'PATCH'].includes(method)
  ) {
    headers.push(...headersJson());
  }
  if (opts.auth) {
    const tokenVar = opts.auth === 'user' ? 'userToken' : 'adminToken';
    headers.push({ key: 'Authorization', value: `Bearer {{${tokenVar}}}` });
  }
  return headers;
}

function saveTokenScript(variableName) {
  return [
    'var json = pm.response.json();',
    'if (json && json.data && json.data.token) {',
    `  pm.collectionVariables.set('${variableName}', json.data.token);`,
    '}',
  ];
}

function request(name, method, path, opts = {}) {
  const req = {
    method,
    header: requestHeaders(method, opts),
    url: typeof path === 'string' ? url(path, opts.query) : path,
  };

  if (opts.formdata !== undefined) {
    req.body = {
      mode: 'formdata',
      formdata: opts.formdata,
    };
  }

  if (opts.body !== undefined) {
    req.body = jsonBody(opts.body);
  }
  if (opts.description) {
    req.description = opts.description;
  }

  const item = { name, request: req, response: [] };
  if (opts.testScript) {
    item.event = [
      {
        listen: 'test',
        script: { type: 'text/javascript', exec: opts.testScript },
      },
    ];
  }
  return item;
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
  variable: [
    { key: 'baseUrl', value: 'http://localhost:9000' },
    { key: 'adminToken', value: '' },
    { key: 'userToken', value: '' },
    { key: 'resetToken', value: '' },
    { key: 'userId', value: '1' },
    { key: 'cartId', value: '1' },
    { key: 'orderId', value: '' },
  ],
  item: [
    folder('Health', 'Server status', [
      request('Health check (root)', 'GET', '/api/', {
        json: false,
        description: 'Returns app name and status.',
      }),
      request('Health check', 'GET', '/api/health', {
        json: false,
        description: 'Returns `{ status: "ok" }`.',
      }),
    ]),
    folder('Profile', 'Users and addresses (MySQL)', [
      request('User login', 'POST', '/api/login', {
        body: { email: 'jane.doe@example.com', password: 'secret123' },
        description:
          'Authenticates a user and stores the returned JWT into the `userToken` collection variable. Run before authenticated profile/order requests.',
        testScript: saveTokenScript('userToken'),
      }),
      request('User logout', 'POST', '/api/logout', {
        body: { token: '{{userToken}}' },
        description: 'Revokes the current user JWT. Clears `userToken` on the client after a successful response.',
      }),
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
        auth: 'user',
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
        description: 'Requires authenticated user. Run `User login` first.',
      }),
      request('Get addresses by user', 'GET', '/api/addresses/{{userId}}', {
        auth: 'user',
        json: false,
        description: 'Requires authenticated user. Run `User login` first.',
      }),
      request('Forgot password (request reset link)', 'POST', '/api/users/forgot-password', {
        body: { email: 'jane.doe@example.com' },
        description:
          'Generates a single-use reset token and emails a link. Always returns a generic success message (no account enumeration). With SMTP unconfigured, the link is logged to the server console — copy the token into the `resetToken` variable for the next request.',
      }),
      request('Reset password (with token)', 'POST', '/api/users/reset-password', {
        body: { token: '{{resetToken}}', newPassword: 'newSecret123' },
        description:
          'Consumes the emailed token (single-use) and sets the new password. Minimum 8 characters.',
      }),
    ]),
    folder('Product', 'Catalog: spaces, categories, sections, products', [
      folder('Spaces', null, [
        request('Create space', 'POST', '/api/spaces', {
          auth: true,
          body: { name: 'Living Room' },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Update space', 'PUT', '/api/spaces', {
          auth: true,
          body: { id: 1, name: 'Living Room' },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Get space by id', 'GET', '/api/spaces', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get space by name', 'GET', '/api/spaces', {
          query: [{ key: 'name', value: 'Living Room' }],
        }),
        request('Get all spaces', 'GET', '/api/spaces/all'),
        request('Delete space', 'DELETE', '/api/spaces/1', {
          auth: true,
          json: false,
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
      ]),
      folder('Categories', null, [
        request('Create category', 'POST', '/api/categories', {
          auth: true,
          body: { name: 'Sofas' },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Update category', 'PUT', '/api/categories', {
          auth: true,
          body: { id: 1, name: 'Sofas' },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Get category by id', 'GET', '/api/categories', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get category by name', 'GET', '/api/categories', {
          query: [{ key: 'name', value: 'Sofas' }],
        }),
        request('Get all categories', 'GET', '/api/categories/all'),
        request('Delete category', 'DELETE', '/api/categories/1', {
          auth: true,
          json: false,
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
      ]),
      folder('Sections', null, [
        request('Create section', 'POST', '/api/sections', {
          auth: true,
          body: { space_id: 1, category_id: 1 },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Update section', 'PUT', '/api/sections', {
          auth: true,
          body: { id: 1, space_id: 1, category_id: 1 },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Get section by id', 'GET', '/api/sections', {
          query: [{ key: 'id', value: '1' }],
        }),
        request('Get sections by space', 'GET', '/api/sections', {
          query: [{ key: 'space_id', value: '1' }],
        }),
        request('Get all sections', 'GET', '/api/sections/all'),
        request('Delete section', 'DELETE', '/api/sections/1', {
          auth: true,
          json: false,
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
      ]),
      folder('Products', null, [
        request('Upload product image', 'POST', '/api/products/images/upload', {
          auth: true,
          json: false,
          formdata: [
            {
              key: 'product_id',
              type: 'text',
              value: 'REPLACE_WITH_MONGO_PRODUCT_ID',
              description: 'MongoDB product id',
            },
            {
              key: 'image',
              type: 'file',
              src: '',
              description: 'Pick an image file from your local machine',
            },
          ],
          description:
            'Requires admin JWT. Uploads image to S3, appends URL into product.images, and returns updated images metadata. Run `Admin login` first.',
        }),
        request('Create product', 'POST', '/api/products', {
          auth: true,
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
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Update product', 'PUT', '/api/products', {
          auth: true,
          body: {
            id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            title: 'Oak Study Desk',
            category_id: 1,
            mrp: 14000,
            discount: 15,
          },
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
        request('Update product inventory', 'PATCH', '/api/products/REPLACE_WITH_MONGO_PRODUCT_ID/inventory', {
          auth: true,
          body: { units: 25 },
          description: 'Requires admin JWT. Updates stock units for a product.',
        }),
        request('Get product inventory', 'GET', '/api/products/REPLACE_WITH_MONGO_PRODUCT_ID/inventory', {
          json: false,
          description: 'Public read of current stock units.',
        }),
        request('Get product by id', 'GET', '/api/products', {
          query: [{ key: 'id', value: 'REPLACE_WITH_MONGO_PRODUCT_ID' }],
        }),
        request('Get products by categories', 'GET', '/api/products', {
          query: [{ key: 'category_ids', value: '1,2' }],
        }),
        request('Search products', 'GET', '/api/products/search', {
          query: [
            { key: 'q', value: 'oak chair' },
            { key: 'category_ids', value: '1,2' },
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
          ],
        }),
        request('Suggest products', 'GET', '/api/products/suggest', {
          query: [
            { key: 'q', value: 'oa' },
            { key: 'limit', value: '5' },
          ],
        }),
        request('List products (paginated)', 'GET', '/api/products/list', {
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
          ],
        }),
        request('Delete product', 'DELETE', '/api/products/REPLACE_WITH_MONGO_PRODUCT_ID', {
          auth: true,
          json: false,
          description: 'Requires admin JWT. Run `Admin login` first.',
        }),
      ]),
    ]),
    folder('Order', 'Orders, carts, cart items (MongoDB + MySQL carts)', [
      folder('Orders', null, [
        request('Create order', 'POST', '/api/orders', {
          auth: 'user',
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
          description:
            'Requires authenticated user. Order ids are MongoDB ObjectIds on update/delete. Run `User login` first.',
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
          auth: 'user',
          query: [{ key: 'id', value: '{{orderId}}' }],
          description: 'Requires authenticated user. Run `User login` first.',
        }),
        request('Get orders by user', 'GET', '/api/orders', {
          auth: 'user',
          query: [{ key: 'user_id', value: '{{userId}}' }],
          description: 'Requires authenticated user. Run `User login` first.',
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
          auth: 'user',
          body: {
            user_id: 1,
            product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            quantity: 1,
          },
          description: 'Requires authenticated user. Creates cart for user if missing. Run `User login` first.',
        }),
        request('Update cart item', 'PUT', '/api/cart-items', {
          auth: 'user',
          body: {
            id: 1,
            user_id: 1,
            cart_id: 1,
            product_id: 'REPLACE_WITH_MONGO_PRODUCT_ID',
            quantity: 2,
          },
          description: 'Requires authenticated user. Run `User login` first.',
        }),
        request('Get cart item by id', 'GET', '/api/cart-items', {
          auth: 'user',
          query: [{ key: 'id', value: '1' }],
          description: 'Requires authenticated user. Run `User login` first.',
        }),
        request('Get cart items by user', 'GET', '/api/cart-items', {
          auth: 'user',
          query: [{ key: 'user_id', value: '{{userId}}' }],
          description: 'Requires authenticated user. Run `User login` first.',
        }),
        request('Get cart items by cart', 'GET', '/api/cart-items', {
          auth: 'user',
          query: [{ key: 'cart_id', value: '{{cartId}}' }],
          description: 'Requires authenticated user. Run `User login` first.',
        }),
        request('Delete cart item', 'DELETE', '/api/cart-items/1', {
          auth: 'user',
          json: false,
          description: 'Requires authenticated user. Run `User login` first.',
        }),
      ]),
    ]),
    folder('Admin', 'Admin authentication, user management, and self-service (`/api/admin/*`)', [
      request('Admin login', 'POST', '/api/admin/login', {
        body: { email: 'admin@example.com', password: 'admin123' },
        description:
          'Authenticates an admin and stores the returned JWT into the `adminToken` collection variable.',
        testScript: saveTokenScript('adminToken'),
      }),
      request('List admins', 'GET', '/api/admin', {
        auth: true,
        json: false,
        description: 'Lists all admin users. Requires any authenticated admin. Run `Admin login` first.',
      }),
      request('Create admin', 'POST', '/api/admin', {
        auth: true,
        body: {
          name: 'New Admin',
          email: 'new.admin@example.com',
          password: 'admin12345',
          role: 'admin',
          is_active: true,
        },
        description:
          'Creates a new admin at `POST /api/admin`. Requires superadmin role. Allowed roles: superadmin, admin.',
      }),
      request('Update admin', 'PUT', '/api/admin', {
        auth: true,
        body: {
          id: 2,
          name: 'Updated Admin',
          role: 'admin',
          is_active: true,
        },
        description:
          'Updates an existing admin at `PUT /api/admin`. Requires superadmin role. Password is optional.',
      }),
      request('Admin change password (old + new)', 'POST', '/api/admin/change-password', {
        auth: true,
        body: { oldPassword: 'admin123', newPassword: 'newAdmin123' },
        description:
          'Authenticated admin self-service password change. Verifies the current password, then sets a new one (min 8 chars, must differ from current). Run `Admin login` first to populate `adminToken`.',
      }),
    ]),
  ],
};

const outPath = path.join(__dirname, 'urbanoak.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2) + '\n');
console.log('Wrote', outPath);
