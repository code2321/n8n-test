/**
 * Utility functions for formatting API responses consistently
 */

/**
 * Format success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(Object.keys(meta).length > 0 && { meta })
  });
};

/**
 * Format error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object|Array} errors - Error details
 */
const errorResponse = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format paginated response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination details
 * @param {Object} meta - Additional metadata
 */
const paginatedResponse = (
  res,
  statusCode = 200,
  message = 'Success',
  data = [],
  pagination = {},
  meta = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    count: data.length,
    pagination: {
      total: pagination.total || 0,
      limit: pagination.limit || 10,
      page: pagination.page || 1,
      pages: pagination.pages || 1,
      ...pagination
    },
    data,
    ...(Object.keys(meta).length > 0 && { meta })
  });
};

/**
 * Format not found response
 * @param {Object} res - Express response object
 * @param {String} message - Not found message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, 404, message);
};

/**
 * Format validation error response
 * @param {Object} res - Express response object
 * @param {Object|Array} errors - Validation errors
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 400, 'Validation Error', errors);
};

/**
 * Format unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Unauthorized message
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, 401, message);
};

/**
 * Format forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Forbidden message
 */
const forbiddenResponse = (res, message = 'Forbidden access') => {
  return errorResponse(res, 403, message);
};

export {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse
};