const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, bookingController.getAllBookings);
router.get('/technician', auth, role('technician'), bookingController.getTechnicianBookings);
router.get('/user', auth, role('user'), bookingController.getUserBookings);
router.get('/:id', auth, bookingController.getBookingById);
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.put('/:id/status', auth, bookingController.updateBookingStatus);
router.delete('/:id', auth, bookingController.deleteBooking);
router.put('/:id/respond', auth, bookingController.technicianRespondBooking);
router.post('/:id/respond', auth, bookingController.technicianRespondBooking);
router.put('/:id/confirm', bookingController.confirmBooking);

// New routes for improved booking flow
router.post('/:id/quote', auth, role('technician'), bookingController.setQuote);
router.post('/:id/respond-quote', auth, role('user'), bookingController.respondToQuote);

// Real-time booking system routes
router.post('/broadcast', auth, role('user'), bookingController.broadcastBookingRequest);
router.get('/pending-requests', auth, role('technician'), bookingController.getPendingRequests);
router.get('/technician/:technicianId/pending', bookingController.getTechnicianPendingRequests);
router.post('/:bookingId/respond', auth, role('technician'), bookingController.respondToBookingRequest);
router.post('/:bookingId/select-technician', auth, role('user'), bookingController.selectTechnicianOffer);
router.get('/:bookingId/offers', auth, role('user'), bookingController.getTechnicianOffers);
router.post('/:id/admin-approval', auth, role('admin'), bookingController.adminApproval);

module.exports = router;
