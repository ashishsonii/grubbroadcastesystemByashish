const multer = require('multer');
const { ValidationError } = require('sequelize');
const { error } = require('../utils/response.util');

/**
 * Global Error Handler Middleware.
 * Must be the last middleware registered in Express.
 * Catches all unhandled errors and returns consistent JSON responses.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Global Error Handler:', err.message);

  // ── Multer Errors ──────────────────────────────────────
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'File too large. Maximum size is 10MB.', 400, [err.message]);
    }
    return error(res, `File upload error: ${err.message}`, 400, [err.message]);
  }

  // Multer custom errors (e.g., file type validation from fileFilter)
  if (err.message && err.message.includes('Only jpg, png, gif')) {
    return error(res, err.message, 400, [err.message]);
  }

  // ── JWT Errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token.', 401, [err.message]);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token has expired.', 401, [err.message]);
  }

  // ── Sequelize Validation Errors ────────────────────────
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    return error(res, 'Validation failed.', 422, messages);
  }

  // ── Sequelize Unique Constraint Error ──────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, 'Duplicate entry.', 409, messages);
  }

  // ── Generic Errors ─────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error.' : err.message;

  return error(res, message, statusCode, process.env.NODE_ENV === 'development' ? [err.message] : []);
};

module.exports = { errorHandler };
