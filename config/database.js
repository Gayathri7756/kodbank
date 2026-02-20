// Use SQLite for local development if MySQL connection fails
const USE_SQLITE = true;  // Set to false when Aiven MySQL is accessible

let pool;

if (USE_SQLITE) {
  console.log('🔄 Using SQLite database (local)');
  pool = require('./database-sqlite');
} else {
  console.log('🔄 Using MySQL database (Aiven)');
  const mysql = require('mysql2/promise');
  require('dotenv').config();

  // Parse the Service URI if provided, otherwise use individual parameters
  let connectionConfig;

  if (process.env.DB_SERVICE_URI) {
    connectionConfig = process.env.DB_SERVICE_URI;
  } else {
    connectionConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 30000
    };
  }

  pool = mysql.createPool(connectionConfig);

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✅ MySQL connection successful');
      connection.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection failed:', err.message);
      console.log('� Tip: Set USE_SQLITE = true in config/database.js to use local database');
    });
}

module.exports = pool;
