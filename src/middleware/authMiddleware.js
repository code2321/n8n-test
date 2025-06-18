import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { ApiError } from './errorHandler.js';
import User from '../models/userModel.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer token format
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, return unauthorized error
    if (!token) {
      return next(new ApiError(401, 'Not authorized, no token provided'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Find user by id from decoded token
      const user = await User.findById(decoded.id).select('-password');

      // If user not found, return unauthorized error
      if (!user) {
        return next(new ApiError(401, 'User not found'));
      }

      // Check if user is active
      if (!user.isActive) {
        return next(new ApiError(401, 'User account is deactivated'));
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      // Handle token verification errors
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token'));
      } else if (error.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired'));
      } else {
        logger.error('Auth middleware error:', error);
        return next(new ApiError(401, 'Not authorized'));
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to specified roles
 * @param {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return next(new ApiError(403, 'User role not defined'));
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Role ${req.user.role} is not authorized to access this resource`));
    }

    next();
  };
};

export { protect, authorize };