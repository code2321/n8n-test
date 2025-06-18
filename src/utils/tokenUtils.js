import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from './logger';

/**
 * Generate JWT token
 * @param {Object} payload - Data to be included in token
 * @param {String} secret - Secret key for signing token
 * @param {String|Number} expiresIn - Token expiration time
 * @returns {String} - JWT token
 */
const generateToken = (payload, secret = config.jwt.secret, expiresIn = config.jwt.expiresIn) => {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Error generating authentication token');
  }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {String} secret - Secret key for verification
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token, secret = config.jwt.secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('Token verification failed:', error.name);
    throw error;
  }
};

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {String|null} - JWT token or null if not found
 */
const extractTokenFromHeader = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Decode token without verification
 * Useful for debugging or getting token payload without verification
 * @param {String} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decoding failed:', error);
    return null;
  }
};

export {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  decodeToken
};