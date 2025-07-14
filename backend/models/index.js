const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

const User = require('./user')(sequelize);
const Service = require('./service')(sequelize);
const Booking = require('./booking')(sequelize);
const Payment = require('./payment')(sequelize);
const Review = require('./review')(sequelize);

// Associations
User.hasMany(Booking);
Booking.belongsTo(User);

Service.hasMany(Booking);
Booking.belongsTo(Service);

Booking.hasOne(Payment);
Payment.belongsTo(Booking);

User.hasMany(Review);
Review.belongsTo(User);

Service.hasMany(Review);
Review.belongsTo(Service);

module.exports = {
  sequelize,
  User,
  Service,
  Booking,
  Payment,
  Review,
};
