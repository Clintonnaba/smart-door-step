const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/', auth, role('user'), ratingController.createRating);
router.get('/technician/:technicianId', ratingController.getTechnicianRatings);
router.get('/technician/:technicianId/average', ratingController.getAverageRating);

module.exports = router; 