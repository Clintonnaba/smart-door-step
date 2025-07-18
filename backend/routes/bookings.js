const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, bookingController.getAllBookings);
router.get('/:id', auth, bookingController.getBookingById);
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);
router.get('/technician', auth, bookingController.getTechnicianBookings);
router.put('/:id/respond', auth, bookingController.technicianRespondBooking);
router.get('/user', auth, role('user'), bookingController.getUserBookings);
router.put('/:id/confirm', bookingController.confirmBooking);

module.exports = router;
