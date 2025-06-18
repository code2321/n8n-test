import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Custom error class for API errors
 * Allows setting status code and custom message
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Formats error responses and logs errors appropriately
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = undefined;
  
  // Log error with appropriate level
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      error: err.name,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = Object.values(err.errors).map(val => val.message);
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    statusCode = 400;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue)[0];
    errorDetails = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT validation error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errorDetails && { details: errorDetails }),
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
};

export { errorHandler, ApiError };