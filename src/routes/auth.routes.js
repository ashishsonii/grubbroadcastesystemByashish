const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public — register a new teacher account.
 */
router.post(
  '/register',
  [
    body('name')
      .notEmpty().withMessage('Name is required.')
      .trim(),
    body('email')
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role')
      .optional()
      .isIn(['teacher']).withMessage('Only teacher role is allowed for public registration.'),
  ],
  authController.register
);

/**
 * POST /api/auth/login
 * Public — login with credentials.
 */
router.post(
  '/login',
  [
    body('email')
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

module.exports = router;
