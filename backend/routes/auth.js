const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/admin/login', authController.adminLogin);
router.post('/technician/login', authController.technicianLogin);
router.post('/customer/login', authController.customerLogin);

module.exports = router;
