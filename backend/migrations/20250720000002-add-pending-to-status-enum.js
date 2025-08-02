'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'Pending' to the enum using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Bookings\` 
      MODIFY COLUMN \`status\` ENUM('Pending', 'requested', 'offers_sent', 'customer_selected', 'admin_approved', 'technician_assigned', 'completed', 'cancelled') NOT NULL DEFAULT 'Pending';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove 'Pending' from the enum
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Bookings\` 
      MODIFY COLUMN \`status\` ENUM('requested', 'offers_sent', 'customer_selected', 'admin_approved', 'technician_assigned', 'completed', 'cancelled') NOT NULL DEFAULT 'requested';
    `);
  }
}; 