const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.get('/', auth, paymentController.getAllPayments);
router.get('/:id', auth, paymentController.getPaymentById);
router.post('/', auth, paymentController.createPayment);

module.exports = router;
