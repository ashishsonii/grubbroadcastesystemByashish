const { Content, User, ContentSchedule } = require('../models');

/**
 * Get all pending content (for principal approval queue).
 * @param {Object} options - { page, limit }
 * @returns {Object} { data, total, page, limit, totalPages }
 */
const getPendingContent = async ({ page = 1, limit = 10 }) => {
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows: data, count: total } = await Content.findAndCountAll({
    where: { status: 'pending' },
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'email', 'role'],
      },
      {
        model: ContentSchedule,
        as: 'schedule',
        attributes: ['rotation_order', 'duration'],
      },
    ],
    order: [['created_at', 'ASC']], // oldest first for FIFO review
    limit: parseInt(limit, 10),
    offset,
  });

  return {
    data,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  };
};

/**
 * Approve a content item.
 * @param {string} contentId - Content UUID
 * @param {string} principalId - Approving principal's UUID
 * @returns {Object} Updated content
 */
const approveContent = async (contentId, principalId) => {
  const content = await Content.findByPk(contentId);

  if (!content) {
    const err = new Error('Content not found.');
    err.statusCode = 404;
    throw err;
  }

  if (content.status !== 'pending') {
    const err = new Error(`Content is already ${content.status}. Only pending content can be approved.`);
    err.statusCode = 400;
    throw err;
  }

  content.status = 'approved';
  content.approved_by = principalId;
  content.approved_at = new Date();
  await content.save();

  // Reload with associations
  const updated = await Content.findByPk(contentId, {
    include: [
      { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
      { model: ContentSchedule, as: 'schedule' },
    ],
  });

  return updated;
};

/**
 * Reject a content item.
 * @param {string} contentId - Content UUID
 * @param {string} reason - Rejection reason (required)
 * @returns {Object} Updated content
 */
const rejectContent = async (contentId, reason) => {
  const content = await Content.findByPk(contentId);

  if (!content) {
    const err = new Error('Content not found.');
    err.statusCode = 404;
    throw err;
  }

  if (content.status !== 'pending') {
    const err = new Error(`Content is already ${content.status}. Only pending content can be rejected.`);
    err.statusCode = 400;
    throw err;
  }

  content.status = 'rejected';
  content.rejection_reason = reason;
  await content.save();

  // Reload with associations
  const updated = await Content.findByPk(contentId, {
    include: [
      { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
      { model: ContentSchedule, as: 'schedule' },
    ],
  });

  return updated;
};

module.exports = { getPendingContent, approveContent, rejectContent };
