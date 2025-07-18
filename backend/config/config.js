module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MySQL@2025',
    database: process.env.DB_NAME || 'smart-door-step',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MySQL@2025',
    database: process.env.DB_NAME || 'smart-door-step',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MySQL@2025',
    database: process.env.DB_NAME || 'smart-door-step',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
};
