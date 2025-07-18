require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth-simple');

const app = express();
const PORT = 5003;

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

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
}); 