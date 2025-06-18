import crypto from 'crypto';
import User from '../models/userModel.js';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(409, 'User with this email already exists'));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Log successful registration
    logger.info(`New user registered: ${email}`);

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.matchPassword(password))) {
      // Log failed login attempt
      logger.warn(`Failed login attempt for email: ${email}`);
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Check if user account is active
    if (!user.isActive) {
      return next(new ApiError(401, 'Your account has been deactivated'));
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Log successful login
    logger.info(`User logged in: ${email}`);

    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // User is already attached to req by auth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'No user found with that email'));
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a real application, you would send an email with the reset token
    // For this example, we'll just return the token in the response
    logger.info(`Password reset requested for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken // In production, this would be sent via email, not in response
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resettoken } = req.params;

    // Hash the reset token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(resettoken)
      .digest('hex');

    // Find user by reset token and check if token is expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired token'));
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT token
    const token = user.generateAuthToken();

    // Log password reset
    logger.info(`Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if (!(await user.matchPassword(currentPassword))) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new JWT token
    const token = user.generateAuthToken();

    // Log password update
    logger.info(`Password updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (client-side)
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  // Log logout
  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout
};