const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const config = require('.');
const { isMongoEnabled } = require('./mongo');

const sqlConfig = config.mySQL;

const pool = mysql.createPool({
  host: sqlConfig.host,
  user: sqlConfig.user,
  password: sqlConfig.password,
  database: sqlConfig.database_name,
  port: Number(sqlConfig.port),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on('connection', () => {
  console.log('Connected to MySQL');
});

pool.on('error', (error) => {
  console.error('Error connecting to MySQL:', error);
});

if (isMongoEnabled()) {
  const mongoConfig = config.mongoDB;

  const MONGO_DB_URI =
    'mongodb://' +
    mongoConfig.user + ':' +
    mongoConfig.password + '@' +
    mongoConfig.host + ':' +
    mongoConfig.port + '/' +
    mongoConfig.database_name +
    '?authSource=' + mongoConfig.auth_source +
    '&authMechanism=' + mongoConfig.auth_mechanism;

  mongoose.connect(MONGO_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  }).catch((error) => {
    console.error('MongoDB connection failed (server will keep running):', error.message);
  });

  mongoose.connection.on('error', (error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  mongoose.connection.on('connected', async () => {
    console.log('Connected to MongoDB');

    try {
      const { ensureMongoIndexes } = require('../models/mongoSchemas');
      await ensureMongoIndexes();
      console.log('MongoDB indexes synced');
    } catch (error) {
      console.error('MongoDB index sync failed:', error.message);
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Reconnected to MongoDB');
  });
} else {
  console.log('MongoDB is disabled (MONGO_ENABLED=false)');
}

module.exports = {
  pool,
  mongoose,
};
