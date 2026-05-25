const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const {
  SQL_DB_HOST = '127.0.0.1',
  SQL_DB_USER = 'root',
  SQL_DB_PASSWORD = 'root',
  SQL_DB_NAME = 'urbanoak',
  SQL_DB_PORT = 3306,
  MONGO_DB_HOST = '127.0.0.1',
  MONGO_DB_NAME = 'urbanoak',
  MONGO_DB_PORT = 27017,
  MONGO_DB_USER = 'root',
  MONGO_DB_PASSWORD = 'root',
  MONGO_DB_AUTH_MECHANISM = 'SCRAM-SHA-1',
  MONGO_DB_AUTH_SOURCE = 'admin',
} = process.env;

const pool = mysql.createPool({
  host: SQL_DB_HOST,
  user: SQL_DB_USER,
  password: SQL_DB_PASSWORD,
  database: SQL_DB_NAME,
  port: Number(SQL_DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//mysql connection status logs
pool.on('connection', () => {
  console.log('Connected to MySQL');
});

pool.on('error', (error) => {
  console.error('Error connecting to MySQL:', error);
});


//create mongoose db connection and status logs
const MONGO_DB_URI = `mongodb://${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOST}:${MONGO_DB_PORT}/${MONGO_DB_NAME}?authSource=${MONGO_DB_AUTH_SOURCE}&authMechanism=${MONGO_DB_AUTH_MECHANISM}`;
mongoose.connect(MONGO_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (error) => {
  console.error('Error connecting to MongoDB:', error);
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('Reconnected to MongoDB');
});

module.exports = {
  pool,
  mongoose,
};


// Check for any potential issues in the file

// 1. Ensure required variables are defined before usage: SQL_DB_HOST, SQL_DB_USER, etc., and MONGO_DB_* variables.
//    If these are expected to come from environment variables, confirm that they are loaded properly (e.g., with dotenv) before requiring this file.

// 2. Error handling on DB connections is present for both MySQL and MongoDB, which is good.

// 3. The MySQL event "error" log is set on the pool object. However, the mysql2 'pool' does NOT emit 'error' events for connection-level errors—these are usually provided in callbacks or as rejected promises. Consider capturing errors per-query as well.

// 4. The MongoDB URI includes authentication options, which is correct for advanced cases, but be certain all values are correctly set (watch out for undefined values which can result in malformed URIs).

// 5. The code uses both SQL and Mongo in the same module. This is fine, but be aware of the runtime overhead if either DB is not required for certain projects.

// 6. No logic is present to handle connection retries in case of initial failure for either database. For robust production use, consider adding retry logic or connection state checks.

// 7. The 'mongoose' connect options use deprecated fields in latest versions;
//    'useNewUrlParser' and 'useUnifiedTopology' are fine for now, but check mongoose docs for future-breaking changes.

// 8. No logic to close/dispose the DB connections is present in this file. 
//    In server environments, this is not strictly required, but for graceful shutdowns, application signal handling should call close/shutdown methods.

// 9. Consider not logging full DB connection parameters or passwords for security, even by accident.