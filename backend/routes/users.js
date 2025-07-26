const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

// GET /users/profile - return current user info
router.get('/profile', auth, role('user'), async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// GET /users - return all users (admin only)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /me - return current user info (for profile page)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile /me error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Add customer login route
router.post('/login', authController.customerLogin);

module.exports = router;
