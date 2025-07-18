const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { ServiceTechnician } = require('../models');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /technicians - return all users with role 'technician'
router.get('/', async (req, res) => {
  try {
    const { service, category, gender } = req.query;
    let technicians;
    let where = { role: 'technician' };
    if (gender) where.gender = gender;
    if (category) {
      if (category.toLowerCase().includes('clean')) {
        where.gender = 'female';
      } else {
        where.gender = 'male';
      }
    }
    if (service) {
      // Find all userIds for this service
      const links = await ServiceTechnician.findAll({ where: { serviceId: service } });
      const userIds = links.map(l => l.userId);
      technicians = await User.findAll({ where: { ...where, id: userIds } });
    } else {
      technicians = await User.findAll({ where });
    }
    // Add mock availability and rating for demo
    const result = technicians.map(t => ({
      id: t.id,
      name: t.fullName,
      email: t.email,
      phone: t.phone,
      skills: t.skills,
      gender: t.gender,
      availability: 'Available today',
      rating: 4.5 + (t.id % 5) * 0.1, // 4.5-4.9
    }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
});

router.get('/profile', auth, role('technician'), async (req, res) => {
  try {
    const { User } = require('../models');
    const technician = await User.findByPk(req.user.userId, {
      attributes: ['id', 'fullName', 'email', 'phone', 'skills', 'role'],
    });
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.json({ user: technician });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch technician profile' });
  }
});

module.exports = router; 