const { Booking, User, Service, Technician, TechnicianResponse, Rating } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['fullName', 'email'] },
        { model: Technician, as: 'technician', attributes: ['name', 'email'] },
        { model: Service, as: 'service', attributes: ['name', 'basePrice'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    console.log('[ADMIN ALL BOOKINGS]', {
      totalBookings: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        userId: b.userId,
        technicianId: b.technicianId,
        status: b.status,
        user: b.user?.fullName,
        technician: b.technician?.name
      }))
    });
    
    res.json(Array.isArray(bookings) ? bookings : []);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
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
      // Handle different token formats (User, Technician, Customer)
      userId = decoded.userId || decoded.technicianId || decoded.customerId || decoded.id || decoded.sub || decoded.user_id;
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
    // Get service details for minimum fare
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const booking = await Booking.create({
      userId: userId,
      technicianId: null, // No technician assigned initially
      serviceId,
      date,
      time,
      address,
      problemNote: notes, // Store as problem description
      price: service.basePrice, // Set minimum fare from service
      status: 'Pending', // Start as Pending as per requirements
    });
    
    // Emit event to all technicians with matching skills
    const io = req.app.get('io');
    io.emit('booking:new', {
      bookingId: booking.id,
      serviceType: service.name,
      customerName: decoded.fullName,
      problemDescription: notes,
      date: date,
      time: time,
      location: address,
      minimumFare: service.basePrice
    });
    
    console.log('[NEW BOOKING CREATED]', {
      bookingId: booking.id,
      serviceType: service.name,
      status: booking.status,
      customerName: decoded.fullName
    });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

exports.updateBooking = (req, res) => {
  res.json({ message: `Update booking ID: ${req.params.id}` });
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('[ADMIN STATUS UPDATE]', { bookingId: id, newStatus: status });
    
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved, Rejected, or Pending' });
    }
    
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If admin is approving and no technician is assigned, assign one automatically
    if (status === 'Approved' && !booking.technicianId) {
      // Find an available technician for this service
      const service = await Service.findByPk(booking.serviceId);
      if (service) {
        // Find a technician with matching skills or any available technician
        const technician = await Technician.findOne({
          where: {
            skills: {
              [Op.like]: `%${service.category}%`
            }
          }
        });
        
        if (technician) {
          booking.technicianId = technician.id;
          console.log('[AUTO ASSIGN] Assigned technician', technician.name, 'to booking', id);
        } else {
          // Fallback: assign the first available technician
          const fallbackTechnician = await Technician.findOne();
          if (fallbackTechnician) {
            booking.technicianId = fallbackTechnician.id;
            console.log('[AUTO ASSIGN] Assigned fallback technician', fallbackTechnician.name, 'to booking', id);
          }
        }
      }
    }
    
    booking.status = status;
    await booking.save();
    
    console.log('[ADMIN STATUS UPDATED]', { 
      bookingId: id, 
      status: booking.status,
      technicianId: booking.technicianId 
    });
    
    res.json({ message: `Booking ${status.toLowerCase()}`, booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

exports.deleteBooking = (req, res) => {
  res.json({ message: `Delete booking ID: ${req.params.id}` });
};

exports.adminApproval = async (req, res) => {
  try {
    console.log('[ADMIN APPROVAL] Request:', { 
      params: req.params, 
      body: req.body, 
      method: req.method 
    });

    const { id } = req.params;
    const { action } = req.body; // 'grant' or 'deny'
    
    console.log('[ADMIN APPROVAL] Processing:', { bookingId: id, action });
    
    if (!['grant', 'deny'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be grant or deny' });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking status based on admin action
    if (action === 'grant') {
      booking.status = 'approved';
      
      // If no technician is assigned, assign one automatically
      if (!booking.technicianId) {
        const service = await Service.findByPk(booking.serviceId);
        if (service) {
          const technician = await Technician.findOne({
            where: {
              skills: {
                [Op.like]: `%${service.name}%`
              }
            }
          });
          
          if (technician) {
            booking.technicianId = technician.id;
            console.log('[AUTO ASSIGN] Assigned technician', technician.name, 'to booking', id);
          } else {
            // Fallback: assign the first available technician
            const fallbackTechnician = await Technician.findOne();
            if (fallbackTechnician) {
              booking.technicianId = fallbackTechnician.id;
              console.log('[AUTO ASSIGN] Assigned fallback technician', fallbackTechnician.name, 'to booking', id);
            }
          }
        }
      }
    } else {
      booking.status = 'declined';
    }

    await booking.save();
    
    console.log('[ADMIN APPROVAL] Success:', { 
      bookingId: id, 
      action,
      status: booking.status,
      technicianId: booking.technicianId
    });

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      // Notify technician about admin decision
      if (booking.technicianId) {
        io.to(`technician_${booking.technicianId}`).emit('admin:booking-approved', {
          bookingId: booking.id,
          status: booking.status,
          action: action
        });
      }
      
      // Notify customer about admin decision
      io.to(`user_${booking.userId}`).emit('admin:booking-approved', {
        bookingId: booking.id,
        status: booking.status,
        action: action
      });
    }

    res.json({ 
      message: `Booking ${action}ed successfully`, 
      booking,
      success: true
    });
  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({ message: 'Failed to process admin approval', error: error.message });
  }
};

exports.getTechnicianBookings = async (req, res) => {
  try {
    // Use req.user from middleware instead of doing JWT verification again
    if (!req.user || req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }
    
    // Extract technician ID from JWT token - technician login uses technicianId
    const technicianId = req.user.technicianId || req.user.id;
    
    console.log('[TECHNICIAN BOOKINGS]', { 
      technicianId: technicianId, 
      role: req.user.role,
      fullUser: req.user
    });
    
    // First, let's check what bookings exist for this technician
    const allBookings = await Booking.findAll({
      where: { technicianId: technicianId },
      raw: true
    });
    
    console.log('[TECHNICIAN BOOKINGS RAW]', { 
      technicianId: technicianId, 
      bookingsFound: allBookings.length,
      bookings: allBookings
    });
    
    const bookings = await Booking.findAll({
      where: { technicianId: technicianId },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'fullName', 'email', 'phone'] 
        },
        { 
          model: Service, 
          as: 'service', 
          attributes: ['id', 'name', 'basePrice'] 
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    console.log('[TECHNICIAN BOOKINGS RESULT]', { 
      technicianId: technicianId, 
      bookingsFound: bookings.length,
      bookings: bookings.map(b => ({ 
        id: b.id, 
        technicianId: b.technicianId, 
        status: b.status,
        user: b.user?.fullName,
        service: b.service?.name,
        date: b.date,
        time: b.time
      }))
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Technician bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch technician bookings' });
  }
};

exports.technicianRespondBooking = async (req, res) => {
  try {
    console.log('[TECHNICIAN RESPOND] Request:', { 
      params: req.params, 
      body: req.body, 
      method: req.method 
    });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gmrsfuuobrlachkf');
    if (decoded.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }
    
    // Extract technician ID from JWT token
    const technicianId = decoded.technicianId || decoded.userId || decoded.id;
    
    const { id } = req.params;
    const { status, proposedFare, responseStatus, eta } = req.body;
    
    console.log('[TECHNICIAN RESPOND] Processing:', { 
      bookingId: id, 
      technicianId, 
      status, 
      proposedFare, 
      responseStatus, 
      eta 
    });

    // Handle both old and new payload formats
    const finalStatus = responseStatus || status;
    if (!['accepted', 'rejected', 'declined'].includes(finalStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking with technician response
    if (finalStatus === 'accepted') {
      booking.technicianId = technicianId;
      booking.status = 'accepted';
      if (proposedFare) {
        booking.proposedPrice = proposedFare;
      }
      // Store ETA in problemNote for now (we can add a separate field later)
      if (eta) {
        booking.problemNote = booking.problemNote ? `${booking.problemNote} | ETA: ${eta}` : `ETA: ${eta}`;
      }
    } else {
      booking.status = 'rejected';
    }

    await booking.save();
    
    console.log('[TECHNICIAN RESPOND] Success:', { 
      bookingId: id, 
      status: booking.status,
      technicianId: booking.technicianId,
      proposedPrice: booking.proposedPrice
    });

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      // Notify customer about technician response
      io.to(`user_${booking.userId}`).emit('technician-offer-created', {
        bookingId: booking.id,
        technicianId: technicianId,
        technicianName: decoded.fullName || 'Technician',
        proposedFare: proposedFare || booking.price,
        eta: eta,
        status: finalStatus
      });
      
      // Notify admin about new offer
      io.emit('admin:new-offer', {
        bookingId: booking.id,
        technicianId: technicianId,
        technicianName: decoded.fullName || 'Technician',
        proposedFare: proposedFare || booking.price,
        status: finalStatus
      });
    }

    res.json({ 
      message: `Booking ${finalStatus}`, 
      booking,
      success: true
    });
  } catch (error) {
    console.error('Technician respond booking error:', error);
    res.status(500).json({ message: 'Failed to update booking status', error: error.message });
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
    
    console.log('[CONFIRM BOOKING]', { bookingId: id, technicianId, status });
    
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    console.log('[BOOKING BEFORE UPDATE]', { 
      id: booking.id, 
      currentTechnicianId: booking.technicianId, 
      currentStatus: booking.status 
    });
    
    if (technicianId) {
      booking.technicianId = technicianId;
      console.log('[SETTING TECHNICIAN ID]', technicianId);
    }
    if (status) {
      // Map 'confirmed' to 'Approved' for consistency
      const mappedStatus = status === 'confirmed' ? 'Approved' : status;
      booking.status = mappedStatus;
      console.log('[SETTING STATUS]', mappedStatus);
    }
    
    await booking.save();
    
    console.log('[BOOKING AFTER UPDATE]', { 
      id: booking.id, 
      technicianId: booking.technicianId, 
      status: booking.status 
    });
    
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

// Technician sets quote for a booking
exports.setQuote = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }

    const { id } = req.params;
    const { proposedPrice } = req.body;
    
    console.log('[TECHNICIAN SET QUOTE]', { 
      bookingId: id, 
      technicianId: req.user.technicianId || req.user.userId || req.user.id,
      proposedPrice 
    });

    if (!proposedPrice || proposedPrice <= 0) {
      return res.status(400).json({ message: 'Invalid proposed price' });
    }

    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['fullName', 'email'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const technicianId = req.user.technicianId || req.user.userId || req.user.id;
    if (booking.technicianId !== parseInt(technicianId)) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only set quote for pending bookings' });
    }

    booking.proposedPrice = proposedPrice;
    booking.status = 'quoted';
    await booking.save();

    console.log('[QUOTE SET]', { 
      bookingId: id, 
      proposedPrice, 
      status: booking.status 
    });

    // Emit event to customer
    const io = req.app.get('io');
    io.to(`user_${booking.userId}`).emit('booking:quoted', { 
      id: booking.id, 
      proposedPrice,
      technicianName: req.user.name || req.user.fullName,
      serviceName: booking.service?.name
    });

    res.json({ 
      message: 'Quote sent successfully', 
      booking: {
        id: booking.id,
        status: booking.status,
        proposedPrice: booking.proposedPrice,
        user: booking.user,
        service: booking.service
      }
    });
  } catch (error) {
    console.error('Set quote error:', error);
    res.status(500).json({ message: 'Failed to set quote' });
  }
};

// Customer responds to technician's quote
exports.respondToQuote = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }

    const { id } = req.params;
    const { response } = req.body; // 'accept' or 'reject'
    
    console.log('[CUSTOMER RESPOND TO QUOTE]', { 
      bookingId: id, 
      userId: req.user.userId || req.user.id,
      response 
    });

    if (!['accept', 'reject'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response. Must be accept or reject' });
    }

    const booking = await Booking.findByPk(id, {
      include: [
        { model: Technician, as: 'technician', attributes: ['name', 'email'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userId = req.user.userId || req.user.id;
    if (booking.userId !== parseInt(userId)) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }

    if (booking.status !== 'quoted') {
      return res.status(400).json({ message: 'Can only respond to quoted bookings' });
    }

    // Update booking status based on response
    booking.status = response === 'accept' ? 'confirmed' : 'declined';
    await booking.save();

    console.log('[QUOTE RESPONSE]', { 
      bookingId: id, 
      response, 
      status: booking.status 
    });

    // Emit event to technician
    const io = req.app.get('io');
    io.to(`technician_${booking.technicianId}`).emit('booking:quoteResponse', { 
      id: booking.id, 
      response,
      status: booking.status,
      customerName: req.user.fullName || req.user.name,
      serviceName: booking.service?.name
    });

    res.json({ 
      message: `Quote ${response}ed successfully`, 
      booking: {
        id: booking.id,
        status: booking.status,
        proposedPrice: booking.proposedPrice,
        technician: booking.technician,
        service: booking.service
      }
    });
  } catch (error) {
    console.error('Respond to quote error:', error);
    res.status(500).json({ message: 'Failed to respond to quote' });
  }
};

// Real-time booking system methods
exports.broadcastBookingRequest = async (req, res) => {
  try {
    const { serviceId, date, time, problemNote, location } = req.body;
    
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }

    // DEBUG: Log booking creation
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Creating booking request:', {
        userId: req.user.userId,
        serviceId,
        date,
        time,
        problemNote,
        status: 'requested'
      });
    }

    // Create booking with 'requested' status
    const booking = await Booking.create({
      userId: req.user.userId,
      serviceId,
      date,
      time,
      problemNote,
      status: 'requested',
      price: null // No price yet, will be set by technician
    });

    // DEBUG: Log booking created
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Booking created successfully:', {
        bookingId: booking.id,
        status: booking.status,
        serviceId: booking.serviceId
      });
    }

    // Get service details for broadcasting
    const service = await Service.findByPk(serviceId);
    
    // Get all technicians with matching skills
    const technicians = await Technician.findAll({
      where: { 
        // For now, get all technicians. In production, filter by skills
      }
    });

    // DEBUG: Log technicians found
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Broadcasting to technicians:', {
        bookingId: booking.id,
        serviceName: service.name,
        techniciansFound: technicians.length,
        technicianIds: technicians.map(t => t.id)
      });
    }

    // Broadcast to all technicians via Socket.IO
    const io = req.app.get('io');
    technicians.forEach(technician => {
      io.to(`technician_${technician.id}`).emit('booking:request', {
        bookingId: booking.id,
        serviceName: service.name,
        basePrice: service.basePrice,
        customerName: req.user.fullName,
        customerPhone: req.user.phone,
        date,
        time,
        problemNote,
        location: location || 'Kathmandu, Nepal'
      });
    });

    res.status(201).json({ 
      message: 'Booking request broadcasted to technicians',
      booking 
    });
  } catch (error) {
    console.error('Broadcast booking request error:', error);
    res.status(500).json({ message: 'Failed to broadcast booking request' });
  }
};

exports.respondToBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { proposedFare, responseStatus, eta } = req.body;
    
    if (!req.user || req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }

    const technicianId = req.user.technicianId;

    // Check if booking exists and is in 'requested' status
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'requested') {
      return res.status(400).json({ message: 'Booking is not in requested status' });
    }

    // Create or update technician response
    const [response, created] = await TechnicianResponse.findOrCreate({
      where: { bookingId, technicianId },
      defaults: {
        proposedFare,
        responseStatus,
        eta
      }
    });

    if (!created) {
      // Update existing response
      response.proposedFare = proposedFare;
      response.responseStatus = responseStatus;
      response.eta = eta;
      await response.save();
    }

    // If this is the first response, update booking status to 'offers_sent'
    const responseCount = await TechnicianResponse.count({ where: { bookingId } });
    if (responseCount === 1) {
      booking.status = 'offers_sent';
      await booking.save();
    }

    // Notify customer about the new offer
    const io = req.app.get('io');
    
    // Get technician details for better notification
    const technician = await Technician.findByPk(technicianId);
    
    const notificationData = {
      bookingId,
      technicianId,
      technicianName: technician?.name || req.user.fullName,
      proposedFare,
      eta,
      responseStatus,
      serviceName: booking.service?.name || 'Service'
    };
    
    // Emit to customer
    io.to(`user_${booking.userId}`).emit('booking:offer', notificationData);
    
    // Also emit to all connected clients for real-time updates
    io.emit('booking:response', notificationData);
    
    console.log('[TECHNICIAN RESPONSE]', {
      bookingId,
      technicianId,
      technicianName: technician?.name,
      responseStatus,
      proposedFare,
      customerId: booking.userId
    });

    res.json({ 
      message: 'Response sent successfully',
      response 
    });
  } catch (error) {
    console.error('Respond to booking request error:', error);
    res.status(500).json({ message: 'Failed to send response' });
  }
};

exports.selectTechnicianOffer = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { technicianId } = req.body;
    
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }

    // Get booking and verify ownership
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }

    // Get the selected technician response
    const response = await TechnicianResponse.findOne({
      where: { bookingId, technicianId }
    });
    if (!response) {
      return res.status(404).json({ message: 'Technician response not found' });
    }

    // Update booking with selected technician and price
    booking.technicianId = technicianId;
    booking.price = response.proposedFare;
    booking.status = 'customer_selected';
    await booking.save();

    // Notify admin about the selection
    const io = req.app.get('io');
    io.to('admin').emit('booking:customer_selected', {
      bookingId,
      technicianId,
      customerName: req.user.fullName,
      proposedFare: response.proposedFare
    });

    // Notify the selected technician
    io.to(`technician_${technicianId}`).emit('booking:selected', {
      bookingId,
      customerName: req.user.fullName
    });

    res.json({ 
      message: 'Technician selected successfully',
      booking 
    });
  } catch (error) {
    console.error('Select technician offer error:', error);
    res.status(500).json({ message: 'Failed to select technician' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Not a technician' });
    }

    const technicianId = req.user.technicianId;

    // DEBUG: Log technician info
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Technician fetching pending requests:', {
        technicianId,
        role: req.user.role
      });
    }

    // Get technician details to check skills
    const technician = await Technician.findByPk(technicianId);
    if (!technician) {
      console.error('[ERROR] Technician not found:', technicianId);
      return res.status(404).json({ message: 'Technician not found' });
    }

    // DEBUG: Log technician skills
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Technician skills:', {
        technicianId,
        skills: technician.skills,
        name: technician.name
      });
    }

    // Get all 'Pending' bookings
    const allPendingBookings = await Booking.findAll({
      where: { 
        status: 'Pending'
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'basePrice'] },
        { 
          model: TechnicianResponse, 
          where: { technicianId },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // DEBUG: Log all pending bookings found
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] All pending bookings found:', {
        technicianId,
        totalBookings: allPendingBookings.length,
        bookings: allPendingBookings.map(b => ({
          id: b.id,
          serviceName: b.service?.name,
          serviceId: b.serviceId,
          status: b.status,
          hasResponse: b.TechnicianResponses && b.TechnicianResponses.length > 0
        }))
      });
    }

    // Filter out bookings that this technician has already responded to
    const filteredRequests = allPendingBookings.filter(booking => 
      !booking.TechnicianResponses || booking.TechnicianResponses.length === 0
    );

    // DEBUG: Log filtered results
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Filtered pending requests for technician:', {
        technicianId,
        filteredCount: filteredRequests.length,
        requests: filteredRequests.map(r => ({
          id: r.id,
          serviceName: r.service?.name,
          customerName: r.user?.fullName
        }))
      });
    }

    res.json(filteredRequests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Failed to fetch pending requests' });
  }
};

exports.getTechnicianOffers = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }

    // Get booking and verify ownership
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }

    // Get all technician responses for this booking
    const offers = await TechnicianResponse.findAll({
      where: { bookingId },
      include: [
        { 
          model: Technician, 
          attributes: ['id', 'name', 'email', 'phone', 'skills'],
          include: [
            {
              model: Rating,
              attributes: ['rating'],
              separate: true,
              order: [['createdAt', 'DESC']],
              limit: 10
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Calculate average rating for each technician
    const offersWithRatings = offers.map(offer => {
      const ratings = offer.Technician.Ratings;
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : '4.5'; // Default rating for demo

      return {
        ...offer.toJSON(),
        technician: {
          ...offer.Technician.toJSON(),
          averageRating: avgRating
        }
      };
    });

    res.json(offersWithRatings);
  } catch (error) {
    console.error('Get technician offers error:', error);
    res.status(500).json({ message: 'Failed to fetch offers' });
  }
};

// New endpoint for technician pending requests with skill matching
exports.getTechnicianPendingRequests = async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    // DEBUG: Log request
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Getting pending requests for technician:', technicianId);
    }

    // Get technician details
    const technician = await Technician.findByPk(technicianId);
    if (!technician) {
      console.error('[ERROR] Technician not found:', technicianId);
      return res.status(404).json({ message: 'Technician not found' });
    }

    // DEBUG: Log technician skills
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Technician skills:', {
        technicianId,
        skills: technician.skills,
        name: technician.name
      });
    }

    // Get all 'Pending' bookings
    const allPendingBookings = await Booking.findAll({
      where: { 
        status: 'Pending'
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'basePrice'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get technician responses separately
    const technicianResponses = await TechnicianResponse.findAll({
      where: { technicianId: parseInt(technicianId) },
      attributes: ['bookingId']
    });

    const respondedBookingIds = technicianResponses.map(r => r.bookingId);

    // DEBUG: Log all bookings found
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] All pending bookings found:', {
        technicianId,
        totalBookings: allPendingBookings.length,
        bookings: allPendingBookings.map(b => ({
          id: b.id,
          serviceName: b.service?.name,
          serviceId: b.serviceId,
          status: b.status,
          hasResponse: respondedBookingIds.includes(b.id)
        }))
      });
    }

    // Filter out bookings that this technician has already responded to
    const filteredRequests = allPendingBookings.filter(booking => 
      !respondedBookingIds.includes(booking.id)
    );

    // TODO: Add skill matching logic here
    // For now, return all filtered requests
    // In production, filter by technician skills matching service type

    // DEBUG: Log final results
    if (process.env.DEBUG_PENDING_REQUESTS === 'true') {
      console.log('[DEBUG] Final pending requests for technician:', {
        technicianId,
        filteredCount: filteredRequests.length,
        requests: filteredRequests.map(r => ({
          id: r.id,
          serviceName: r.service?.name,
          customerName: r.user?.fullName,
          basePrice: r.service?.basePrice
        }))
      });
    }

    res.json({
      technician: {
        id: technician.id,
        name: technician.name,
        skills: technician.skills
      },
      pendingRequests: filteredRequests,
      debug: process.env.DEBUG_PENDING_REQUESTS === 'true' ? {
        totalBookingsFound: allPendingBookings.length,
        filteredCount: filteredRequests.length,
        timestamp: new Date().toISOString()
      } : undefined
    });
  } catch (error) {
    console.error('Get technician pending requests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch pending requests',
      error: error.message 
    });
  }
};