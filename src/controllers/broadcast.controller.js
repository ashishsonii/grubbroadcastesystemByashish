const { Op, fn, col, literal } = require('sequelize');
const { Content, User } = require('../models');
const { success, error } = require('../utils/response.util');

/**
 * GET /api/analytics/subjects
 * Subject-wise analytics (principal only).
 * Returns: array of { subject, total_content, approved_count, active_now_count }
 */
const getSubjectAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    // Get all unique subjects with counts
    const subjects = await Content.findAll({
      attributes: [
        'subject',
        [fn('COUNT', col('id')), 'total_content'],
        [fn('SUM', literal("CASE WHEN status = 'approved' THEN 1 ELSE 0 END")), 'approved_count'],
        [
          fn(
            'SUM',
            literal(
              `CASE WHEN status = 'approved' AND start_time <= '${now.toISOString()}' AND end_time >= '${now.toISOString()}' THEN 1 ELSE 0 END`
            )
          ),
          'active_now_count',
        ],
      ],
      group: ['subject'],
      order: [['subject', 'ASC']],
      raw: true,
    });

    const analytics = subjects.map((row) => ({
      subject: row.subject,
      total_content: parseInt(row.total_content, 10),
      approved_count: parseInt(row.approved_count, 10) || 0,
      active_now_count: parseInt(row.active_now_count, 10) || 0,
    }));

    return success(res, analytics, 'Subject analytics retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSubjectAnalytics };
