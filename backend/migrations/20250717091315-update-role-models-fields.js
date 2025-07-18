'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Admin
    await queryInterface.addColumn('Admins', 'name', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Admins', 'role', { type: Sequelize.STRING, allowNull: false, defaultValue: 'admin' });
    await queryInterface.addColumn('Admins', 'phone', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Admins', 'location', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Admins', 'age', { type: Sequelize.INTEGER, allowNull: false });
    // Technician
    await queryInterface.addColumn('Technicians', 'name', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Technicians', 'role', { type: Sequelize.STRING, allowNull: false, defaultValue: 'technician' });
    await queryInterface.addColumn('Technicians', 'phone', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Technicians', 'location', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Technicians', 'age', { type: Sequelize.INTEGER, allowNull: false });
    // Customer
    await queryInterface.addColumn('Customers', 'name', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Customers', 'role', { type: Sequelize.STRING, allowNull: false, defaultValue: 'customer' });
    await queryInterface.addColumn('Customers', 'phone', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Customers', 'location', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('Customers', 'age', { type: Sequelize.INTEGER, allowNull: false });
  },

  async down (queryInterface, Sequelize) {
    // Admin
    await queryInterface.removeColumn('Admins', 'name');
    await queryInterface.removeColumn('Admins', 'role');
    await queryInterface.removeColumn('Admins', 'phone');
    await queryInterface.removeColumn('Admins', 'location');
    await queryInterface.removeColumn('Admins', 'age');
    // Technician
    await queryInterface.removeColumn('Technicians', 'name');
    await queryInterface.removeColumn('Technicians', 'role');
    await queryInterface.removeColumn('Technicians', 'phone');
    await queryInterface.removeColumn('Technicians', 'location');
    await queryInterface.removeColumn('Technicians', 'age');
    // Customer
    await queryInterface.removeColumn('Customers', 'name');
    await queryInterface.removeColumn('Customers', 'role');
    await queryInterface.removeColumn('Customers', 'phone');
    await queryInterface.removeColumn('Customers', 'location');
    await queryInterface.removeColumn('Customers', 'age');
  }
};
