const request = require('supertest');
const app = require('../index');

describe('Basic API Tests', () => {
  describe('GET /', () => {
    it('should return backend is running message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Backend is running!');
    });
  });

  describe('POST /api/register', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          phone: '1234567890',
          role: 'customer'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 for protected routes without token', async () => {
      const response = await request(app)
        .get('/api/bookings');

      expect(response.status).toBe(401);
    });
  });
}); 