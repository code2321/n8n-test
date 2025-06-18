import User from '../models/userModel.js';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await User.countDocuments();
    
    // Query users with pagination
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit
    };
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user (admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(409, 'User with this email already exists'));
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });
    
    // Log user creation
    logger.info(`Admin ${req.user.email} created new user: ${email}`);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Fields to update
    const { name, email, role, isActive } = req.body;
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Save updated user
    await user.save();
    
    // Log user update
    logger.info(`Admin ${req.user.email} updated user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return next(new ApiError(400, 'You cannot delete your own account'));
    }
    
    await user.deleteOne();
    
    // Log user deletion
    logger.info(`Admin ${req.user.email} deleted user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own profile (for regular users)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    // Get user
    const user = await User.findById(req.user.id);
    
    // Update fields if provided
    const { name, email } = req.body;
    if (name) user.name = name;
    
    // If email is being changed, check if it's already in use
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return next(new ApiError(409, 'Email already in use'));
      }
      user.email = email;
    }
    
    // Save updated user
    await user.save();
    
    // Log profile update
    logger.info(`User updated profile: ${user.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
};