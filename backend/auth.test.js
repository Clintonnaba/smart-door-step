const request = require('supertest');
const { sequelize, User } = require('./models');
const app = require('./index');

const testUser = {
  fullName: 'Test User',
  email: 'testuser@example.com',
  phone: '1234567890',
  password: 'TestPassword123',
  role: 'user',
};

describe('Auth API', () => {
  afterEach(async () => {
    // Clean up users after each test
    await User.destroy({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('Register with valid data → expect 201 and user saved to DB', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    // Check user in DB
    const user = await User.findOne({ where: { email: testUser.email } });
    expect(user).not.toBeNull();
  });

  test('Login with wrong password → expect 401 Unauthorized', async () => {
    // Register first
    await User.create({
      fullName: testUser.fullName,
      email: testUser.email,
      phone: testUser.phone,
      password: await require('bcrypt').hash(testUser.password, 10),
      role: 'user',
    });
    const res = await request(app)
      .post('/api/login')
      .send({ email: testUser.email, password: 'WrongPassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('Access /api/users/profile with valid JWT → expect 200 OK', async () => {
    // Register and login
    await request(app).post('/api/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.token;
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  test('Access /api/users/profile without token → expect 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/users/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
}); 