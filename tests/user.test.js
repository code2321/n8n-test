const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/userModel');
const { config } = require('../src/config/config');

// Test user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin@123456',
  role: 'admin'
};

const regularUser = {
  name: 'Regular User',
  email: 'user@example.com',
  password: 'User@123456',
  role: 'user'
};

// Store JWT tokens for authenticated requests
let adminToken;
let userToken;
let userId;

// Connect to test database before tests
beforeAll(async () => {
  // Use a separate test database
  await mongoose.connect(config.mongoUri + '-test');
  
  // Clear users collection
  await User.deleteMany({});
  
  // Create admin user
  const admin = await User.create(adminUser);
  adminToken = admin.generateAuthToken();
  
  // Create regular user
  const user = await User.create(regularUser);
  userToken = user.generateAuthToken();
  userId = user._id.toString();
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

// Test user routes
describe('User API', () => {
  // Test get all users (admin only)
  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(2);
    });

    it('should not allow regular users to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // Test get user by ID (admin only)
  describe('GET /api/users/:id', () => {
    it('should get user by ID as admin', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(regularUser.email);
    });

    it('should not allow regular users to get user by ID', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test create user (admin only)
  describe('POST /api/users', () => {
    it('should create a new user as admin', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newtest@example.com',
        password: 'NewTest@123456',
        role: 'user'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(newUser.email);
    });

    it('should not allow regular users to create users', async () => {
      const newUser = {
        name: 'Another Test User',
        email: 'another@example.com',
        password: 'Another@123456'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // Test update user (admin only)
  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      const updateData = {
        name: 'Updated User Name'
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updateData.name);
    });

    it('should not allow regular users to update other users', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // Test update own profile (regular user)
  describe('PUT /api/users/profile', () => {
    it('should allow user to update own profile', async () => {
      const updateData = {
        name: 'My Updated Profile'
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updateData.name);
    });
  });

  // Test delete user (admin only)
  describe('DELETE /api/users/:id', () => {
    it('should not allow regular users to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete user as admin', async () => {
      // Create a user to delete
      const userToDelete = await User.create({
        name: 'Delete Me',
        email: 'delete@example.com',
        password: 'Delete@123456'
      });

      const deleteId = userToDelete._id.toString();

      const res = await request(app)
        .delete(`/api/users/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user was deleted
      const deletedUser = await User.findById(deleteId);
      expect(deletedUser).toBeNull();
    });

    it('should not allow admin to delete themselves', async () => {
      // Get admin ID
      const admin = await User.findOne({ email: adminUser.email });
      const adminId = admin._id.toString();

      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});