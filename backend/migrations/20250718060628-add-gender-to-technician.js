'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Technicians', 'gender', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'male',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Technicians', 'gender');
  },
};
