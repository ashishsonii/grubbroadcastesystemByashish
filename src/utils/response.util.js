/**
 * Standardized API Response Wrapper
 * Ensures consistent response format across all endpoints.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {string} message - Human-readable message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {Array} errors - Array of error detail strings
 */
const error = (res, message = 'Something went wrong', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { success, error };
