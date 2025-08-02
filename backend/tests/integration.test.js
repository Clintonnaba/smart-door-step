const request = require('supertest');
const app = require('../index');

describe('Smart Door Step API Integration Tests', () => {
  describe('Authentication Endpoints', () => {
    describe('POST /api/register', () => {
      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/register')
          .send({
            email: 'test@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for invalid email format', async () => {
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
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for invalid role', async () => {
        const response = await request(app)
          .post('/api/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            phone: '1234567890',
            role: 'invalid_role'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/login', () => {
      it('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/admin/login', () => {
      it('should return 500 for missing credentials', async () => {
        const response = await request(app)
          .post('/api/admin/login')
          .send({});

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/technician/login', () => {
      it('should return 400 for missing credentials', async () => {
        const response = await request(app)
          .post('/api/technician/login')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/customer/login', () => {
      it('should return 500 for missing credentials', async () => {
        const response = await request(app)
          .post('/api/customer/login')
          .send({});

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /api/bookings', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app)
          .get('/api/bookings');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/bookings', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app)
          .post('/api/bookings')
          .send({
            serviceId: 1,
            scheduledDate: '2024-01-15',
            scheduledTime: '10:00',
            address: '123 Test Street'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /api/technicians', () => {
      it('should return technicians list', async () => {
        const response = await request(app)
          .get('/api/technicians');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe('Public Routes', () => {
    describe('GET /', () => {
      it('should return backend is running message', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Backend is running!');
      });
    });
  });

  describe('Error Handling', () => {
    describe('404 Not Found', () => {
      it('should return 404 for non-existent routes', async () => {
        const response = await request(app)
          .get('/api/nonexistent');

        expect(response.status).toBe(404);
      });
    });

    describe('Invalid JSON', () => {
      it('should handle invalid JSON gracefully', async () => {
        const response = await request(app)
          .post('/api/register')
          .set('Content-Type', 'application/json')
          .send('invalid json');

        expect(response.status).toBe(500);
      });
    });
  });
}); 