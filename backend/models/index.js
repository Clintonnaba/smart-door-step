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
const TechnicianResponse = require('./technicianResponse')(sequelize);
const Rating = require('./rating')(sequelize);

// Join table for many-to-many Service-Technician
const ServiceTechnician = sequelize.define('ServiceTechnician', {}, { timestamps: false });

// Associations
Booking.hasOne(Payment);
Payment.belongsTo(Booking);
User.hasMany(Review);
Review.belongsTo(User);
Service.hasMany(Review);
Review.belongsTo(Service);

// New associations for real-time booking system
Booking.hasMany(TechnicianResponse);
TechnicianResponse.belongsTo(Booking);
Technician.hasMany(TechnicianResponse);
TechnicianResponse.belongsTo(Technician);

Technician.hasMany(Rating);
Rating.belongsTo(Technician);
User.hasMany(Rating, { as: 'CustomerRatings', foreignKey: 'customerId' });
Rating.belongsTo(User, { as: 'Customer', foreignKey: 'customerId' });
Booking.hasOne(Rating);
Rating.belongsTo(Booking);

// Many-to-many Service-Technician
if (User.associate) User.associate({ Service });
if (Service.associate) Service.associate({ User });
if (Booking.associate) Booking.associate({ User, Service, Technician });
if (TechnicianResponse.associate) TechnicianResponse.associate({ Booking, Technician });
if (Rating.associate) Rating.associate({ Technician, User, Booking });

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
  TechnicianResponse,
  Rating,
  ServiceTechnician,
};
