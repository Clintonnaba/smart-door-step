'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ratings = [
      {
        technicianId: 1,
        customerId: 1,
        bookingId: 1,
        rating: 5,
        review: 'Excellent service! Very professional and skilled.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        technicianId: 1,
        customerId: 1,
        bookingId: 2,
        rating: 4,
        review: 'Good service, would recommend.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        technicianId: 2,
        customerId: 1,
        bookingId: 3,
        rating: 5,
        review: 'Outstanding work quality!',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        technicianId: 3,
        customerId: 1,
        bookingId: 4,
        rating: 4,
        review: 'Satisfactory work, professional attitude.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Ratings', ratings, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Ratings', null, {});
  }
};
