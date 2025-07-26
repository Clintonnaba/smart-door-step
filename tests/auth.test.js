const request = require('supertest');
const app = require('../app');
const db = require('../db');

const testUser = {
  email: 'testuser@example.com',
  password: 'TestPassword123',
};

describe('Auth API', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    await db.end();
  });

  it('should register a user successfully', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should return 401 for login with wrong password', async () => {
    // Register first
    await request(app).post('/api/register').send(testUser);
    // Attempt login with wrong password
    const res = await request(app)
      .post('/api/login')
      .send({ email: testUser.email, password: 'WrongPassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should allow access to /api/profile with valid token', async () => {
    // Register and login
    await request(app).post('/api/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send(testUser);
    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.token;
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  it('should return 401 for /api/profile without token', async () => {
    const res = await request(app)
      .get('/api/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
}); 