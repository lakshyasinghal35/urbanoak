# urbanoak

E-commerce furniture store API (Express, MySQL, MongoDB).

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **Docker Desktop** (or Docker Engine + Compose) for local MySQL and MongoDB

## Run locally

### 1. Start databases

From the project root:

```bash
docker compose up -d
```

This starts:

| Service | Host port | Credentials |
|---------|-----------|-------------|
| MySQL (Docker) | **3307** → container 3306 | user `root`, password `root`, database `urbanoak` |
| MongoDB | 27017 | user `root`, password `root`, auth database `admin` |
| Elasticsearch | 9200 | local dev single-node (security disabled) |
| Kafka | 9092 | local dev KRaft broker |

`app.config.json` uses MySQL on port **3306** by default (typical for a local MySQL install).

**If port 3306 is already in use** (common on macOS with Homebrew or system MySQL), you already have MySQL locally. Start only MongoDB in Docker:

```bash
docker compose up -d mongodb
```

Then use your local MySQL for step 2 (port 3306). No Docker MySQL container needed.

**If you want MySQL in Docker instead**, after `docker compose up -d`, set `"port": 3307` under `mySQL` in `src/config/app.config.json`.

Check that containers are running:

```bash
docker compose ps
```

### 2. Initialize MySQL schema

Create the database and tables on whichever MySQL you use (local **3306** or Docker **3307**).

Local MySQL (default config):

```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot -e "CREATE DATABASE IF NOT EXISTS urbanoak;"
mysql -h 127.0.0.1 -P 3306 -u root -proot urbanoak < scripts/db/schema.sql
```

Docker MySQL (`mySQL.port` set to `3307` in config):

```bash
mysql -h 127.0.0.1 -P 3307 -u root -proot -e "CREATE DATABASE IF NOT EXISTS urbanoak;"
mysql -h 127.0.0.1 -P 3307 -u root -proot urbanoak < scripts/db/schema.sql
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the API server

Development (auto-restart on file changes):

```bash
npm run dev
```

Production-style:

```bash
npm start
```

The server listens on **http://localhost:9000** (see `httpPort` in `src/config/app.config.json`).

### 5. Verify

Health check:

```bash
curl http://localhost:9000/
```

Example response:

```json
{"name":"urbanoak","status":"ok","api":"/api"}
```

API routes are mounted under **`/api`** (profile, product, and order microservices).

### Postman

Import the collection and local environment from **`postman/`** (see [postman/README.md](postman/README.md)).

## Password reset

Two distinct flows, by user type:

**App users — reset via email link** (`profileMicroservice`):

| Method | Path | Body | Purpose |
|--------|------|------|---------|
| POST | `/api/users/forgot-password` | `{ email }` | Generate a single-use token and email a reset link. Always returns a generic success message (no account enumeration). |
| POST | `/api/users/reset-password` | `{ token, newPassword }` | Validate + consume the token and set the new password. |

Tokens are random, **stored hashed** in the `password_reset_tokens` table, single-use, and expire after `passwordReset.token_ttl_minutes` (default 60). Requesting a new link invalidates any previous unused token. The reset email is sent through the shared email service (`src/common/email`) using the `resetPassword` template.

**Admin users — change via old + new password** (`adminMicroservice`, authenticated):

| Method | Path | Auth | Body | Purpose |
|--------|------|------|------|---------|
| POST | `/api/admin/change-password` | Bearer (admin JWT) | `{ oldPassword, newPassword }` | Verify the current password, then set a new one. |

New passwords must be at least `admin.min_password_length` characters (default 8); the admin flow also requires the new password to differ from the current one. Allowed admin roles and the minimum password length live under the `admin` block in `src/config/app.config.json`.

Reset-link settings live under `passwordReset` (`url_base`, `token_ttl_minutes`, `min_password_length`) in `src/config/app.config.json`. Email delivery is handled by the shared email service: set `EMAIL_ENABLED=true` and the `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` environment variables to send real mail; otherwise it falls back to the console transport and logs the message (handy for local dev — copy the token from the logged link).

Apply the schema change before using the app-user flow:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot urbanoak < scripts/db/migrations/2026_06_password_reset_tokens.sql
```

## Configuration

Database and server settings live in **`src/config/app.config.json`**. Update host, port, credentials, or `httpPort` there if your local setup differs from Docker defaults.

S3 image upload (catalog) is configured in `src/config/app.config.json` under the `s3` block:

- `region` (optional, default `ap-south-1`)
- `bucket_name` (required)
- `catalog_prefix` (optional, default `catalog`)
- `public_base_url` (optional, use your CDN/custom domain base URL)
- `S3_MAX_IMAGE_SIZE_BYTES` (optional, default `5242880`)

Upload endpoint: `POST /api/products/images/upload` (multipart form-data, field name: `image`).
Pass `product_id` in the same form-data payload; the API appends uploaded image URL to that product's `images` array and persists it.

Elasticsearch product search is configured in `src/config/app.config.json` under `elasticsearch`:

- `enabled`
- `node` (default `http://127.0.0.1:9200`)
- `index_name`
- `worker_poll_ms`
- `worker_batch_size`

Search endpoints:

- `GET /api/products/search?q=<text>&category_ids=1,2&page=1&limit=20`
- `GET /api/products/suggest?q=<prefix>&limit=10`

Order event publishing is configured under `kafka`:

- `enabled`
- `client_id`
- `brokers`
- `topic.order_events`

Reindex existing products into Elasticsearch:

```bash
npm run reindex:products
```

Entry point: **`src/app.js`** (loads config, connects to databases, then starts the HTTP server).

## Tests

```bash
npm test
```

## Run the Node app in Docker (optional)

Databases should still be started with Compose first. The app image does not include MySQL or MongoDB:

```bash
docker compose up -d
docker build -t urbanoak .
docker run --rm -p 9000:9000 --network host urbanoak
```

On macOS/Windows, `--network host` may not work as on Linux; map ports explicitly and point `app.config.json` at the database host your container can reach (often `host.docker.internal`).

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `Ports are not available` / `3306: bind: address already in use` | MySQL is already running locally. Use `docker compose up -d mongodb` and keep `mySQL.port` at `3306`, or use Docker MySQL on host port `3307` and set `"port": 3307` in `app.config.json`. |
| `Unknown database 'urbanoak'` | Run the MySQL init commands in step 2. |
| `ECONNREFUSED` on port 27017 | Start Docker Compose (`docker compose up -d mongodb` or full `up -d`). Order/cart features need MongoDB. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop, then retry `docker compose up -d`. |
