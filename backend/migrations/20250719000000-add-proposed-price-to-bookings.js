'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bookings', 'proposedPrice', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'price'
    });

    // Update existing bookings to have null proposedPrice
    await queryInterface.sequelize.query(`
      UPDATE Bookings SET proposedPrice = NULL WHERE proposedPrice IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bookings', 'proposedPrice');
  }
}; 