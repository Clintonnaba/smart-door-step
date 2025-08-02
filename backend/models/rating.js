const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rating = sequelize.define('Rating', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    technicianId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    review: { type: DataTypes.TEXT, allowNull: true },
  });

  Rating.associate = (models) => {
    Rating.belongsTo(models.Technician, { foreignKey: 'technicianId' });
    Rating.belongsTo(models.User, { foreignKey: 'customerId' });
    Rating.belongsTo(models.Booking, { foreignKey: 'bookingId' });
  };

  return Rating;
}; 