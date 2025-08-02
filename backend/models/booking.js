const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: DataTypes.INTEGER, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    status: {
      type: DataTypes.ENUM('Pending', 'requested', 'offers_sent', 'customer_selected', 'admin_approved', 'technician_assigned', 'completed', 'cancelled', 'Approved', 'accepted', 'rejected', 'declined'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    price: { type: DataTypes.FLOAT, allowNull: true }, // Base price from service
    proposedPrice: { type: DataTypes.FLOAT, allowNull: true }, // Technician's proposed price
    problemNote: { type: DataTypes.TEXT, allowNull: true },
    // userId, technicianId, serviceId are defined via associations only
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    Booking.belongsTo(models.Technician, { as: 'technician', foreignKey: 'technicianId' });
    Booking.belongsTo(models.Service, { as: 'service', foreignKey: 'serviceId' });
  };

  return Booking;
};
