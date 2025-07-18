const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Simple admin login route
router.post('/admin/login', (req, res) => {
  console.log('Admin login attempt:', req.body);
  res.json({ message: 'Admin login route working', body: req.body });
});

module.exports = router; 