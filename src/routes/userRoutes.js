import express from 'express';
const router = express.Router();
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createUserValidation,
  updateUserValidation,
  updateProfileValidation,
  getUserByIdValidation,
  validate
} from '../validators/userValidator.js';

/**
 * Admin routes
 * All routes require authentication and admin role
 */

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private/Admin
 */
router.get('/:id', protect, authorize('admin'), validate(getUserByIdValidation), getUserById);

/**
 * @route   POST /api/users
 * @desc    Create a new user (admin)
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), validate(createUserValidation), createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), validate(updateUserValidation), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), validate(getUserByIdValidation), deleteUser);

/**
 * User routes
 * Routes for regular users to manage their own profile
 */

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put('/profile', protect, validate(updateProfileValidation), updateProfile);

export default router;