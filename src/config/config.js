import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Application configuration object
 * Centralizes all configuration settings loaded from environment variables
 * with sensible defaults for development
 */
const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // MongoDB configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/secure-user-auth',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'development_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRE || '24h'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  // Rate limiting configuration
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

/**
 * Validate critical configuration settings
 * Ensures that required environment variables are set
 */
const validateConfig = () => {
  const requiredEnvVars = ['JWT_SECRET'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && config.nodeEnv === 'production') {
      throw new Error(`Environment variable ${envVar} is required in production mode`);
    }
  }
  
  // Warn about using default JWT secret in development
  if (process.env.NODE_ENV !== 'production' && 
      process.env.JWT_SECRET === 'development_secret_key_change_in_production') {
    console.warn('Warning: Using default JWT secret. This is insecure and should be changed.');
  }
};

// Run configuration validation
validateConfig();

export { config };