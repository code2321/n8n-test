const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/userModel');
const { config } = require('../src/config/config');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test@123456'
};

// Store JWT token for authenticated requests
let authToken;

// Connect to test database before tests
beforeAll(async () => {
  // Use a separate test database
  await mongoose.connect(config.mongoUri + '-test');
  
  // Clear users collection
  await User.deleteMany({});
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

// Test authentication routes
describe('Authentication API', () => {
  // Test user registration
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register a user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test user login
  describe('POST /api/auth/login', () => {
    it('should login user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      
      // Save token for authenticated requests
      authToken = res.body.data.token;
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test get current user
  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should not get profile without token', async () => {
      const res = await request(app).get('/api/auth/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test update password
  describe('PUT /api/auth/updatepassword', () => {
    it('should update user password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewTest@123456'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      
      // Update token with new one
      authToken = res.body.data.token;
      
      // Update test user password for future tests
      testUser.password = 'NewTest@123456';
    });

    it('should not update with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewTest@789012'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test logout
  describe('GET /api/auth/logout', () => {
    it('should logout user', async () => {
      const res = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});