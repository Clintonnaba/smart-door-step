const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Admin, Technician, Customer } = require('../models');

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Restrict technician signup
    const technicianEmails = [
      'ramkumar@gmail.com',
      'harisharma@gmail.com',
      'shyamgopal@gmail.com',
      'geetadevi@gmail.com',
    ];
    if (role === 'technician' || technicianEmails.includes(email)) {
      return res.status(403).json({ message: 'Technician signup is not allowed.' });
    }

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        message: 'All fields are required: fullName, email, phone, password'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return success response (don't include password)
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[USER LOGIN] Attempt:', { email, password: '***' });
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ where: { email } });
    console.log('[USER LOGIN] User found:', !!user);
    if (!user) {
      console.log('[USER LOGIN] No user found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log('[USER LOGIN] DB hash:', user.password);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('[USER LOGIN] bcrypt result:', isValidPassword);
    if (!isValidPassword) {
      console.log('[USER LOGIN] Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
    console.log('[LOGIN] Success, token issued');
    res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error('[USER LOGIN] Error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  // Only allow real users with @gmail.com, not demo/technician users
  const user = await User.findOne({ where: { email } });
  if (!user || !email.endsWith('@gmail.com') || user.role === 'technician') {
    return res.status(400).json({ message: 'This email is not eligible for password reset.' });
  }
  // Generate a temporary reset token (stub)
  const resetToken = require('crypto').randomBytes(24).toString('hex');
  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
  console.log(`[FORGOT PASSWORD] Password reset link for ${email}: ${resetLink}`);
  // Respond with success
  res.json({ message: 'Reset link sent to your email!' });
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[ADMIN LOGIN] Attempt:', { email, password: '***' });
    const admin = await Admin.findOne({ where: { email } });
    console.log('[ADMIN LOGIN] Admin found:', !!admin);
    if (!admin) {
      console.log('[ADMIN LOGIN] No admin found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log('[ADMIN LOGIN] DB hash:', admin.password);
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log('[ADMIN LOGIN] bcrypt result:', isValidPassword);
    if (!isValidPassword) {
      console.log('[ADMIN LOGIN] Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      {
        adminId: admin.id,
        fullName: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        age: admin.age
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.status(200).json({
      token,
      user: {
        id: admin.id,
        fullName: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        age: admin.age
      }
    });
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    res.status(500).json({ message: 'Admin login failed' });
  }
};

exports.technicianLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[TECHNICIAN LOGIN] Attempt:', { email, password });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const technician = await Technician.findOne({ where: { email } });
    console.log('[TECHNICIAN LOGIN] Technician found:', !!technician);
    if (!technician) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(password, technician.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      {
        technicianId: technician.id,
        fullName: technician.name,
        email: technician.email,
        role: technician.role,
        phone: technician.phone,
        location: technician.location,
        age: technician.age
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.status(200).json({
      token,
      user: {
        id: technician.id,
        fullName: technician.name,
        email: technician.email,
        role: technician.role,
        phone: technician.phone,
        location: technician.location,
        age: technician.age
      }
    });
  } catch (error) {
    console.error('[TECHNICIAN LOGIN] Error:', error);
    res.status(500).json({ message: 'Technician login failed' });
  }
};

exports.customerLogin = async (req, res) => {
  try {
    console.log('[CUSTOMER LOGIN] Raw body:', req.body);
    const { email, password } = req.body;
    console.log('[CUSTOMER LOGIN] Parsed:', { email, password });
    const customer = await User.findOne({ where: { email, role: 'user' } });
    console.log('[CUSTOMER LOGIN] User found:', !!customer);
    if (!customer) {
      console.log('[CUSTOMER LOGIN] No user found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log('[CUSTOMER LOGIN] DB hash:', customer.password);
    const isValidPassword = await bcrypt.compare(password, customer.password);
    console.log('[CUSTOMER LOGIN] bcrypt result:', isValidPassword);
    if (!isValidPassword) {
      console.log('[CUSTOMER LOGIN] Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      {
        customerId: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        role: 'user',
        phone: customer.phone
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.status(200).json({
      token,
      user: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        role: 'user',
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('[CUSTOMER LOGIN] Error:', error);
    res.status(500).json({ message: 'Customer login failed' });
  }
};
