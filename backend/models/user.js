const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
    skills: { type: DataTypes.STRING, allowNull: true },
  });

  User.associate = (models) => {
    User.belongsToMany(models.Service, {
      through: 'ServiceTechnician',
      as: 'services',
      foreignKey: 'userId',
      otherKey: 'serviceId',
    });
  };

  return User;
};
