import express from 'express';
const router = express.Router();
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updatePasswordValidation
} from '../validators/authValidator.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerValidation), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', validate(loginValidation), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/forgotpassword
 * @desc    Forgot password - send reset email
 * @access  Public
 */
router.post('/forgotpassword', validate(forgotPasswordValidation), forgotPassword);

/**
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @desc    Reset password with token
 * @access  Public
 */
router.put('/resetpassword/:resettoken', validate(resetPasswordValidation), resetPassword);

/**
 * @route   PUT /api/auth/updatepassword
 * @desc    Update password for logged in user
 * @access  Private
 */
router.put('/updatepassword', protect, validate(updatePasswordValidation), updatePassword);

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user (client-side)
 * @access  Private
 */
router.get('/logout', protect, logout);

export default router;