const { error } = require('../utils/response.util');

/**
 * Role-based Access Control Middleware.
 * Returns a middleware that checks if req.user.role is in the allowed roles.
 *
 * @param  {...string} roles - Allowed roles, e.g. 'principal', 'teacher'
 * @returns {Function} Express middleware
 *
 * Usage:
 *   requireRole('principal')
 *   requireRole('teacher', 'principal')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

module.exports = { requireRole };
