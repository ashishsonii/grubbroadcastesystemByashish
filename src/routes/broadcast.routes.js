const express = require('express');
const broadcastController = require('../controllers/broadcast.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * GET /api/analytics/subjects
 * Protected: principal only.
 * Returns subject-wise analytics with counts.
 */
router.get(
  '/subjects',
  authenticate,
  requireRole('principal'),
  broadcastController.getSubjectAnalytics
);

module.exports = router;
