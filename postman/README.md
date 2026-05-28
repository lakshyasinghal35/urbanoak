# Postman — urbanoak API

Import these files into [Postman](https://www.postman.com/downloads/) to call all API routes.

## Import

1. Open Postman → **Import** → **Upload Files**
2. Select both:
   - `urbanoak.postman_collection.json`
   - `urbanoak.local.postman_environment.json`
3. In the top-right environment dropdown, choose **urbanoak — local**

## Regenerate collection

After route changes, refresh the collection file:

```bash
node postman/generate-collection.js
```

Then re-import in Postman (or replace the existing collection).

## Base URL

Default: `http://localhost:9000` (see `httpPort` in `src/config/app.config.json`).

Start the server first:

```bash
npm run dev
```

## Variables

| Variable | Purpose |
|----------|---------|
| `baseUrl` | API host |
| `userId` | Used in profile/order examples |
| `orderId` | MongoDB order id after creating an order |
| `cartId` | Cart id after creating a cart |

Replace `REPLACE_WITH_MONGO_PRODUCT_ID` in product/order bodies with a real product `_id` from `POST /api/products`.

## Catalog image upload

- Use `Product -> Products -> Upload product image`
- Set `product_id` (MongoDB product id) as text form-data
- Choose a local file in the `image` form-data field
- Endpoint: `POST /api/products/images/upload`
- Response includes `bucket`, `key`, `url`, and updated `images` array persisted on the product
