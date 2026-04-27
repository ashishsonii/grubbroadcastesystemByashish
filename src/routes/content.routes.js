const express = require('express');
const { body } = require('express-validator');
const contentController = require('../controllers/content.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ─── Rate limiter for public live endpoint ───────────────
const liveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
    errors: ['Rate limit exceeded.'],
  },
});

/**
 * POST /api/content/upload
 * Protected: teacher only. Multipart form-data.
 */
router.post(
  '/upload',
  authenticate,
  requireRole('teacher'),
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        return next(err); // Let global error handler deal with multer errors
      }
      next();
    });
  },
  [
    body('title')
      .notEmpty().withMessage('Title is required.')
      .isLength({ min: 3 }).withMessage('Title must be at least 3 characters.'),
    body('subject')
      .notEmpty().withMessage('Subject is required.'),
    body('start_time')
      .optional()
      .isISO8601().withMessage('start_time must be a valid ISO datetime.'),
    body('end_time')
      .optional()
      .isISO8601().withMessage('end_time must be a valid ISO datetime.'),
    body('rotation_duration')
      .optional()
      .isInt({ min: 1, max: 60 }).withMessage('rotation_duration must be an integer between 1 and 60.'),
  ],
  contentController.uploadContent
);

/**
 * GET /api/content/my
 * Protected: teacher only. Returns own content with filters.
 */
router.get(
  '/my',
  authenticate,
  requireRole('teacher'),
  contentController.getMyContent
);

/**
 * GET /api/content/all
 * Protected: principal only. Returns all content with filters.
 */
router.get(
  '/all',
  authenticate,
  requireRole('principal'),
  contentController.getAllContent
);

/**
 * GET /api/content/live/:teacherId
 * PUBLIC — no auth required. Rate limited.
 * Returns currently active content for a teacher based on rotation logic.
 */
router.get(
  '/live/:teacherId',
  liveLimiter,
  contentController.getLiveContent
);

module.exports = router;
