const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response.util');

/**
 * POST /api/auth/register
 * Register a new user. Public registration is limited to 'teacher' role.
 */
const register = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed.', 400, errors.array().map((e) => e.msg));
    }

    const { name, email, password, role } = req.body;

    // Enforce: public registration can only create 'teacher'
    if (role && role !== 'teacher') {
      return error(res, 'Only teacher role can be registered publicly.', 400, [
        'Role must be "teacher" for public registration.',
      ]);
    }

    const result = await authService.register({
      name,
      email,
      password,
      role: role || 'teacher', // default to teacher
    });

    return success(res, {
      user: result.user,
      token: result.token,
    }, 'User registered successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password. Returns JWT.
 */
const login = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed.', 400, errors.array().map((e) => e.msg));
    }

    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    return success(res, {
      user: result.user,
      token: result.token,
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
