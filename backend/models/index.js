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
const Admin = require('./admin')(sequelize);
const Technician = require('./technician')(sequelize);
const Customer = require('./customer')(sequelize);

// Join table for many-to-many Service-Technician
const ServiceTechnician = sequelize.define('ServiceTechnician', {}, { timestamps: false });

// Associations
Booking.hasOne(Payment);
Payment.belongsTo(Booking);
User.hasMany(Review);
Review.belongsTo(User);
Service.hasMany(Review);
Review.belongsTo(Service);

// Many-to-many Service-Technician
if (User.associate) User.associate({ Service });
if (Service.associate) Service.associate({ User });
if (Booking.associate) Booking.associate({ User, Service });

module.exports = {
  sequelize,
  User,
  Service,
  Booking,
  Payment,
  Review,
  Admin,
  Technician,
  Customer,
  ServiceTechnician,
};
