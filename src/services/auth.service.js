const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * Teachers can self-register via public endpoint.
 * @param {Object} params - { name, email, password, role }
 * @returns {Object} { user, token }
 */
const register = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await User.create({
    name,
    email,
    password_hash,
    role,
  });

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
};

/**
 * Login an existing user.
 * @param {Object} params - { email, password }
 * @returns {Object} { user, token }
 */
const login = async ({ email, password }) => {
  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
};

/**
 * Generate a JWT for the given user.
 * @param {Object} user - User model instance
 * @returns {string} JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = { register, login, generateToken };
