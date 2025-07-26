const { Rating, Technician, User, Booking } = require('../models');

exports.createRating = async (req, res) => {
  try {
    const { technicianId, bookingId, rating, review } = req.body;
    
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden: Not a user' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: Not your booking' });
    }
    if (booking.technicianId !== technicianId) {
      return res.status(400).json({ message: 'Technician ID does not match booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }

    // Check if user has already rated this booking
    const existingRating = await Rating.findOne({
      where: { bookingId, customerId: req.user.userId }
    });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this booking' });
    }

    // Create rating
    const newRating = await Rating.create({
      technicianId,
      customerId: req.user.userId,
      bookingId,
      rating,
      review
    });

    // Notify technician about new rating
    const io = req.app.get('io');
    io.to(`technician_${technicianId}`).emit('rating:new', {
      rating: newRating.rating,
      review: newRating.review,
      customerName: req.user.fullName
    });

    res.status(201).json({ 
      message: 'Rating submitted successfully',
      rating: newRating 
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};

exports.getTechnicianRatings = async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    const ratings = await Rating.findAll({
      where: { technicianId },
      include: [
        { 
          model: User, 
          as: 'Customer', 
          attributes: ['id', 'fullName'] 
        },
        { 
          model: Booking, 
          attributes: ['id', 'serviceId'],
          include: [
            { 
              model: Service, 
              attributes: ['name'] 
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Calculate average rating
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : '0.0';

    res.json({
      ratings,
      averageRating,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get technician ratings error:', error);
    res.status(500).json({ message: 'Failed to fetch ratings' });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    const ratings = await Rating.findAll({
      where: { technicianId },
      attributes: ['rating']
    });

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : '4.5';

    res.json({
      averageRating,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get average rating error:', error);
    res.status(500).json({ message: 'Failed to fetch average rating' });
  }
}; 