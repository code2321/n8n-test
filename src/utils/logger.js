import winston from 'winston';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = dirname(config.logging.file);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

/**
 * Custom format for console logs
 * Colorizes log levels and formats timestamps
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

/**
 * Format for file logs
 * Includes timestamps and structured JSON for easier parsing
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

/**
 * Winston logger configuration
 * Logs to both console and file with different formats
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.json(),
  defaultMeta: { service: 'secure-user-auth' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      level: config.nodeEnv === 'production' ? 'error' : 'debug'
    }),
    // File transport for persistent logs
    new winston.transports.File({
      filename: config.logging.file,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Separate error log file
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: join(logDir, 'exceptions.log'),
      format: fileFormat
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

/**
 * Stream object for Morgan integration
 * Allows Express request logging through Winston
 */
const stream = {
  write: (message) => logger.info(message.trim())
};

export { logger, stream };