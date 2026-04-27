const { validationResult } = require('express-validator');
const approvalService = require('../services/approval.service');
const { success, error } = require('../utils/response.util');

/**
 * GET /api/approval/pending
 * Get all pending content (principal only).
 */
const getPending = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await approvalService.getPendingContent({
      page: page || 1,
      limit: limit || 10,
    });

    return success(res, result, 'Pending content retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/approval/:contentId/approve
 * Approve a content item (principal only).
 */
const approve = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await approvalService.approveContent(contentId, req.user.id);

    return success(res, content, 'Content approved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/approval/:contentId/reject
 * Reject a content item (principal only). Reason is required.
 */
const reject = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed.', 400, errors.array().map((e) => e.msg));
    }

    const { contentId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return error(res, 'Rejection reason is required and must be at least 10 characters.', 400, [
        'Reason is required and must be at least 10 characters.',
      ]);
    }

    const content = await approvalService.rejectContent(contentId, reason.trim());

    return success(res, content, 'Content rejected.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPending, approve, reject };
