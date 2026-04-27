const express = require('express');
const { body } = require('express-validator');
const approvalController = require('../controllers/approval.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * GET /api/approval/pending
 * Protected: principal only.
 */
router.get(
  '/pending',
  authenticate,
  requireRole('principal'),
  approvalController.getPending
);

/**
 * PATCH /api/approval/:contentId/approve
 * Protected: principal only.
 */
router.patch(
  '/:contentId/approve',
  authenticate,
  requireRole('principal'),
  approvalController.approve
);

/**
 * PATCH /api/approval/:contentId/reject
 * Protected: principal only.
 */
router.patch(
  '/:contentId/reject',
  authenticate,
  requireRole('principal'),
  [
    body('reason')
      .notEmpty().withMessage('Rejection reason is required.')
      .isLength({ min: 10 }).withMessage('Reason must be at least 10 characters.'),
  ],
  approvalController.reject
);

module.exports = router;
