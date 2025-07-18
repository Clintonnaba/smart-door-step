const express = require('express');
const app = express();

app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test working' });
});

// Simple admin login route
app.post('/admin/login', (req, res) => {
  console.log('Admin login attempt:', req.body);
  res.json({ message: 'Admin login route working', body: req.body });
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 