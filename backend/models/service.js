const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    basePrice: { type: DataTypes.FLOAT, allowNull: false },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    reviewCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });

  // Define join table for many-to-many Service-Technician
  Service.associate = (models) => {
    Service.belongsToMany(models.User, {
      through: 'ServiceTechnician',
      as: 'technicians',
      foreignKey: 'serviceId',
      otherKey: 'userId',
    });
  };

  return Service;
};
