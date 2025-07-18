const { Booking, User, Service } = require('../models');
const jwt = require('jsonwebtoken');

exports.getAllBookings = (req, res) => {
  res.json({ message: "Get all bookings" });
};

exports.getBookingById = (req, res) => {
  res.json({ message: `Get booking by ID: ${req.params.id}` });
};

exports.createBooking = async (req, res) => {
  try {
    // Log the full incoming request body and headers for debugging
    console.log('[BOOKING RAW REQUEST] Headers:', req.headers);
    console.log('[BOOKING RAW REQUEST] Body:', req.body);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    
    // Try to decode the JWT token with better error handling
    let decoded;
    let userId;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'gmrsfuuobrlachkf');
      console.log('[JWT DECODED TOKEN]', decoded);
      // Handle different token formats (Google vs custom)
      userId = decoded.userId || decoded.id || decoded.sub || decoded.user_id;
      console.log('[JWT USER ID]', userId);
    } catch (jwtError) {
      console.error('[JWT VERIFICATION ERROR]', jwtError);
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Debug: print full received payload and parsed fields
    console.log('[BACKEND BOOKING DEBUG]', {
      body: req.body,
      userId: userId,
      serviceId: req.body.serviceId,
      technicianId: req.body.technicianId,
      date: req.body.date,
      time: req.body.time,
      price: req.body.price,
      address: req.body.address,
      notes: req.body.notes
    });
    // Support both new and old payloads
    let { serviceId, technicianId, date, time, price, address, notes, scheduledDate, scheduledTime, totalAmount } = req.body;
    // If date/time/price not present, parse from scheduledDate/totalAmount
    if (!date && scheduledDate) {
      if (scheduledDate.includes('T')) {
        [date, time] = scheduledDate.split('T');
      } else {
        date = scheduledDate;
      }
    }
    if (!time && scheduledTime) {
      time = scheduledTime;
    }
    if (!price && totalAmount) {
      price = totalAmount;
    }
    // Log final values before create
    console.log('[BOOKING FINAL FIELDS]', { date, time, price, serviceId, technicianId, address, notes });
    // Fallback: if date or time is still null, set to default and log warning
    if (!date) {
      console.warn('[BOOKING WARNING] date is null, setting to 2025-01-01');
      date = '2025-01-01';
    }
    if (!time) {
      console.warn('[BOOKING WARNING] time is null, setting to 09:00:00');
      time = '09:00:00';
    }
    console.log('[BOOKING DEBUG]', { serviceId, technicianId, date, time, price, address, notes });
    // Log the full incoming request body for debugging
    console.log('[BOOKING INCOMING REQUEST BODY]', req.body);
    // Fallback: parse date if in DD/MM/YYYY format
    if (date && date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        console.log('[BOOKING] Parsed date from DD/MM/YYYY:', date);
      }
    }
    // Log all computed fields
    console.log('[BOOKING FIELDS CHECK]', { serviceId, date, time, address });
    // Log warnings for missing fields
    if (!serviceId) console.warn('[BOOKING WARNING] serviceId is missing or invalid:', serviceId);
    if (!date) console.warn('[BOOKING WARNING] date is missing or invalid:', date);
    if (!time) console.warn('[BOOKING WARNING] time is missing or invalid:', time);
    if (!address) console.warn('[BOOKING WARNING] address is missing or invalid:', address);
    if (!serviceId || !date || !time || !address) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }
    const booking = await Booking.create({
      userId: userId,
      technicianId, // can be null
      serviceId,
      date,
      time,
      address,
      notes,
      price,
      status: 'Pending',
    });
    // Emit event to technician
    const io = req.app.get('io');
    io.to(`technician_${technicianId}`).emit('booking:new', booking);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

exports.updateBooking = (req, res) => {
  res.json({ message: `Update booking ID: ${req.params.id}` });
};

exports.deleteBooking = (req, res) => {
  res.json({ message: `Delete booking ID: ${req.params.id}` });
};

exports.getTechnicianBookings = async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gmrsfuuobrlachkf');
    if (decoded.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }
    const bookings = await Booking.findAll({
      where: { technicianId: decoded.userId },
      include: [
        { model: User, as: 'user', attributes: ['fullName', 'email'] },
        { model: Service, as: 'service', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    console.error('Technician bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch technician bookings' });
  }
};

exports.technicianRespondBooking = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gmrsfuuobrlachkf');
    if (decoded.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.technicianId !== decoded.userId) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }
    booking.status = status;
    await booking.save();
    // Emit event to user and technician
    const io = req.app.get('io');
    io.to(`user_${booking.userId}`).emit('booking:status', { id: booking.id, status });
    io.to(`technician_${booking.technicianId}`).emit('booking:status', { id: booking.id, status });
    res.json({ message: `Booking ${status}`, booking });
  } catch (error) {
    console.error('Technician respond booking error:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }
    const bookings = await Booking.findAll({
      where: { userId: req.user.userId },
      include: [
        { model: User, as: 'technician', attributes: ['fullName', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['name', 'basePrice'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    console.error('User bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch user bookings' });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId, status } = req.body;
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (technicianId) booking.technicianId = technicianId;
    if (status) booking.status = status;
    await booking.save();
    res.json({ message: 'Booking confirmed', booking });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Failed to confirm booking' });
  }
};

// Get all pending bookings (admin)
exports.getPendingBookings = async (req, res) => {
  try {
    const pendingBookings = await Booking.findAll({
      where: { status: 'Pending' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] }
      ]
    });
    res.json(pendingBookings);
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ message: 'Failed to fetch pending bookings' });
  }
};

// Approve a booking (admin)
exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'Approved';
    await booking.save();
    res.json({ message: 'Booking approved', booking });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Failed to approve booking' });
  }
};

// Reject a booking (admin)
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'Rejected';
    await booking.save();
    res.json({ message: 'Booking rejected', booking });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'Failed to reject booking' });
  }
};