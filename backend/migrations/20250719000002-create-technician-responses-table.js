'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TechnicianResponses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      technicianId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Technicians',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      proposedFare: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      responseStatus: {
        type: Sequelize.ENUM('accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'accepted'
      },
      eta: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Estimated time of arrival'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint to prevent multiple responses from same technician for same booking
    await queryInterface.addIndex('TechnicianResponses', ['bookingId', 'technicianId'], {
      unique: true,
      name: 'unique_booking_technician_response'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TechnicianResponses');
  }
}; 