const jwt = require('jsonwebtoken');

// Create a valid JWT token for technician ID 1
const payload = {
  id: 1,
  technicianId: 1,
  name: 'Aayush',
  email: 'aayushtech@gmail.com',
  role: 'technician'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'gmrsfuuobrlachkf', { expiresIn: '24h' });

console.log('🔑 Generated JWT Token for technician ID 1:');
console.log(token);
console.log('\n📋 Decoded payload:');
console.log(JSON.stringify(payload, null, 2));

// Test the API endpoint
const axios = require('axios');

async function testTechnicianBookings() {
  try {
    console.log('\n🧪 Testing technician bookings endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/bookings/technician', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

// Wait a moment for the server to start, then test
setTimeout(testTechnicianBookings, 2000); 