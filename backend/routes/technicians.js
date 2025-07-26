console.log('Technician routes loaded');
const express = require('express');
const router = express.Router();
const { Technician } = require('../models');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /technicians - return all technicians
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/technicians handler hit');
    const { gender } = req.query;
    let where = {};
    if (gender) where.gender = gender;
    const technicians = await Technician.findAll({ where });
    console.log('Technicians found:', technicians.length);
    const result = technicians.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      skills: t.skills,
      gender: t.gender,
      location: t.location,
      age: t.age,
      role: t.role,
      availability: 'Available today',
      rating: 4.5 + (t.id % 5) * 0.1,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
});

router.get('/profile', auth, role('technician'), async (req, res) => {
  try {
    console.log('Profile route hit');
    const id = req.user.technicianId || req.user.userId;
    console.log('Technician ID:', id);
    if (!id) {
      console.log('No technician ID found in JWT');
      return res.status(400).json({ message: 'No technician ID in token' });
    }
    const technician = await Technician.findByPk(id, {
      attributes: ['id', 'name', 'email', 'phone', 'skills', 'role', 'location', 'age', 'gender'],
    });
    console.log('Technician found:', technician);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.json({ user: technician });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Failed to fetch technician profile' });
  }
});

module.exports = router; 