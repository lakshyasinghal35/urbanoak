# Urban Oak - Copilot Instructions

## Project Overview
**Urban Oak** is an e-commerce furniture store API built with Express.js, featuring microservices architecture. It uses:
- **Express.js**: Web framework and routing
- **MySQL** + **MongoDB**: Dual database system (SQL for transactional data, Mongo for others)
- **Mongoose**: MongoDB ODM
- **Authentication**: JWT-based with bcryptjs password hashing
- **Payments**: Stripe integration
- **Notifications**: Nodemailer email support

## Architecture

### Microservices Pattern
Each microservice follows a standardized three-layer pattern in `/src/modules/`:

```
[moduleName]/
├── routes.js      # Express routes (request handling)
├── service.js     # Business logic and transformations
├── repository.js  # Database access layer
├── query.js       # SQL/query constants (when needed)
└── model/         # Data models
    └── [entity].js
```

**Key modules:**
- `productMicroservice`: Products, categories, wood types
- `profileMicroservice`: User auth, accounts, addresses  
- `OrderMicroservice`: Order processing, management
- `notificationMicroservice`: Email notifications
- `searchMicroservice`: Search functionality
- `auth`: Authentication middleware

### Data Flow
1. **Routes** receive HTTP requests, validate input, call service
2. **Service** implements business rules (e.g., password hashing, JWT generation, entity sanitization)
3. **Repository** executes database operations via MySQL pool or Mongoose
4. **Models** define class structures for entities (see `Product` and `User` classes)

## Critical Patterns & Conventions

### Dual Database Access
- **MySQL** (`/src/config/db.js`): Uses `mysql2/promise` with connection pooling
  - Connection config: `host`, `user`, `password`, `database`, `port` from env vars
  - Pool-based (10 connections max, no queue limit)
- **MongoDB** (`/src/config/db.js`): Mongoose connection via URI string
  - Auth mechanism: `SCRAM-SHA-1`, requires `authSource=admin`
  - Environment variables: `MONGO_DB_*` prefix

**Choose based on entity:** Products/categories use MySQL; user sessions might use Mongo

### Service Layer Conventions
- **Input validation** happens in routes (use `express-validator`)
- **Business logic** in service (bcrypt hashing, JWT signing, entity transformation)
- **Data sanitization**: Remove sensitive fields (passwords, IDs) before responses
  - Example: See `sanitizeUser()` pattern in profileMicroservice service layer
  - Pattern: `const { password, id, ...safeData } = user`

### Authentication & Security
- **JWT**: Secret from env var `JWT_SECRET`, expires in `JWT_EXPIRES_IN` (default: 1 hour)
- **Password hashing**: bcryptjs with salt rounds (typically 10)
- **Session validation**: Middleware checks session before route access in server initialization
- **Security headers** (disabled but configurable): `X-XSS-Protection`, `X-Frame-Options`, `X-Content-Type-Options`
- **No-session routes**: Defined in `noSessionUrls` array (login, signup, registration endpoints)

### Error Handling
- Utility classes exist but are mostly empty: `apiError.js`, `response.js`
- **Expected pattern**: Create standardized error objects and response formatters
- Responses should include status codes, messages, and sanitized data

### Models
- Plain JavaScript classes with constructor parameters (destructuring pattern)
- Example: `new Product({ id, title, category_id, ... })`
- No validation or methods; purely data containers

## Development Workflow

### Environment Setup
1. Install: `npm install`
2. Create `.env` with database credentials and secrets:
   ```
   SQL_DB_HOST=127.0.0.1
   SQL_DB_USER=root
   SQL_DB_PASSWORD=root
   SQL_DB_NAME=urbanoak
   JWT_SECRET=your-secret-key
   MONGO_DB_HOST=127.0.0.1
   MONGO_DB_NAME=urbanoak
   ```
3. Start MySQL and MongoDB services

### Running
- **Development**: `npm run dev` (uses nodemon for auto-reload)
- **Production**: `npm start` (node directly)
- **Tests**: `npm test` (Jest configured in package.json)

### Key Files to Know
- **src/server.js**: Server initialization, session handling, security headers, middleware configuration order
- **src/config/db.js**: Database connections (MySQL pool and Mongoose)
- **src/common/jwt.js**: JWT utilities
- **src/common/helpers.js**: Common helper functions
- **package.json**: Dependencies and scripts

## Adding New Features

### New Microservice
1. Create `/src/modules/[serviceName]/` with routes.js, service.js, repository.js
2. Create model classes in `model/` subdirectory
3. Implement three layers: route handler → service logic → repository queries
4. Export and mount router in main routes configuration

### New API Endpoint
1. Add route in `routes.js` with Express method (GET, POST, etc.)
2. Implement service function with business logic and data sanitization
3. Use repository for database calls (MySQL pool or Mongoose)
4. Return sanitized response (no passwords, internal IDs, etc.)

## Important Notes
- **Middleware order matters**: In `src/server.js`, the sequence of `configure()`, `addStaticResources()`, `addSessionValidator()`, `addSecurityHeaders()`, `addRouters()` is critical
- **Database pooling**: MySQL uses pooled connections; always handle connection errors
- **Session vs JWT**: Legacy session-based plus JWT; ensure both mechanisms work together
- **File upload**: Multer is installed but integration point pending
- **Rate limiting**: Express-rate-limit installed; integration pending
