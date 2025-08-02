const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Use User if customers are in User table

const loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email and role
    const user = await User.findOne({ where: { email, role: 'customer' } });

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.fullName, // or user.name if that's your field
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token,
    });

  } catch (error) {
    console.error('Customer login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { loginCustomer };
