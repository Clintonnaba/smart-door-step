require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const technicianRoutes = require('./routes/technicians');
const usersRoutes = require('./routes/users');
const ratingRoutes = require('./routes/ratings');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Expect client to emit 'register' with { userId, role }
  socket.on('register', ({ userId, role }) => {
    if (userId && role) {
      socket.join(`${role}_${userId}`);
      console.log(`Socket ${socket.id} joined room ${role}_${userId}`);
    }
  });
  socket.on('disconnect', () => {
    // No action needed for now
  });
});

const PORT = process.env.PORT || 5001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});



console.log('Mounting routes...');
app.use('/api', authRoutes);
console.log('Auth routes mounted at /api');
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ratings', ratingRoutes);
console.log('All routes mounted');

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

if (require.main === module) {
  sequelize.sync().then(() => {
    console.log('Database synced successfully');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error('Database sync failed:', error);
    process.exit(1);
  });
}

module.exports = app; 