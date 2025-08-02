// Load environment variables
require('dotenv').config({ path: __dirname + '/../.env' });

const { Sequelize } = require('sequelize');

// Debugging (optional): Check if env variables are being read
console.log('Connecting to DB as user:', process.env.DB_USER);

const sequelize = new Sequelize(
  process.env.DB_NAME,         // e.g., 'smart-door-step'
  process.env.DB_USER,         // e.g., 'root'
  process.env.DB_PASSWORD,     // e.g., 'MySQL@2025'
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // disable raw SQL logging
  }
);

// Test the connection (optional but recommended)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  }
})();

module.exports = sequelize;
