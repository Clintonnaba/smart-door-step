'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update the enum to include all required statuses
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Bookings\` 
      MODIFY COLUMN \`status\` ENUM(
        'Pending', 
        'requested', 
        'offers_sent', 
        'customer_selected', 
        'admin_approved', 
        'technician_assigned', 
        'completed', 
        'cancelled',
        'Approved',
        'accepted',
        'rejected',
        'declined'
      ) NOT NULL DEFAULT 'Pending'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to original enum
    await queryInterface.sequelize.query(`
      ALTER TABLE \`Bookings\` 
      MODIFY COLUMN \`status\` ENUM(
        'Pending', 
        'requested', 
        'offers_sent', 
        'customer_selected', 
        'admin_approved', 
        'technician_assigned', 
        'completed', 
        'cancelled'
      ) NOT NULL DEFAULT 'Pending'
    `);
  }
}; 