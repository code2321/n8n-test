import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

/**
 * Generate a secure random string
 * @param {Number} length - Length of the string to generate
 * @returns {String} - Random string
 */
const generateRandomString = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Error generating random string:', error);
    // Fallback to less secure but functional method
    return Math.random().toString(36).substring(2, length + 2);
  }
};

/**
 * Hash a password using bcrypt
 * @param {String} password - Plain text password
 * @param {Number} saltRounds - Number of salt rounds for bcrypt
 * @returns {Promise<String>} - Hashed password
 */
const hashPassword = async (password, saltRounds = 12) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare a password with a hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} - True if passwords match
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate a hash of a string using SHA-256
 * @param {String} data - Data to hash
 * @returns {String} - Hashed data
 */
const hashData = (data) => {
  try {
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    logger.error('Error hashing data:', error);
    throw new Error('Data hashing failed');
  }
};

/**
 * Sanitize user input to prevent injection attacks
 * @param {String} input - User input to sanitize
 * @returns {String} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate a secure reset token
 * @returns {Object} - Object containing reset token and hashed token
 */
const generateResetToken = () => {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiration to 10 minutes from now
  const resetExpires = Date.now() + 10 * 60 * 1000;

  return {
    resetToken,
    hashedToken,
    resetExpires
  };
};

export {
  generateRandomString,
  hashPassword,
  comparePassword,
  hashData,
  sanitizeInput,
  generateResetToken
};