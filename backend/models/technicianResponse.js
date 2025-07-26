const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TechnicianResponse = sequelize.define('TechnicianResponse', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    technicianId: { type: DataTypes.INTEGER, allowNull: false },
    proposedFare: { type: DataTypes.FLOAT, allowNull: false },
    responseStatus: {
      type: DataTypes.ENUM('accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'accepted'
    },
    eta: { type: DataTypes.STRING, allowNull: true },
  });

  TechnicianResponse.associate = (models) => {
    TechnicianResponse.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    TechnicianResponse.belongsTo(models.Technician, { foreignKey: 'technicianId' });
  };

  return TechnicianResponse;
}; 