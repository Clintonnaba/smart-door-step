const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/dashboard', auth, role('admin'), adminController.dashboard);
router.get('/users', auth, role('admin'), adminController.getUsers);
router.post('/users', auth, role('admin'), adminController.createUser);
router.put('/users/:id', auth, role('admin'), adminController.updateUser);
router.delete('/users/:id', auth, role('admin'), adminController.deleteUser);

router.get('/providers', auth, role('admin'), adminController.getProviders);
router.post('/providers', auth, role('admin'), adminController.createProvider);
router.put('/providers/:id', auth, role('admin'), adminController.updateProvider);
router.delete('/providers/:id', auth, role('admin'), adminController.deleteProvider);

router.get('/feedback', auth, role('admin'), adminController.getFeedback);
router.post('/announcements', auth, role('admin'), adminController.sendAnnouncement);

module.exports = router;
