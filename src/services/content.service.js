const { Op } = require('sequelize');
const { Content, ContentSlot, ContentSchedule, User } = require('../models');
const { USE_R2 } = require('../config/multer');

/**
 * Build the public file URL depending on storage type.
 * - R2: uses R2_PUBLIC_URL + the S3 key so the URL is publicly accessible via CDN
 * - Local: builds a relative /uploads/<filename> path
 */
const buildFileUrl = (file) => {
  if (USE_R2) {
    // file.key is set by multer-s3 (e.g. "uploads/1234-image.jpg")
    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    return `${publicBase}/${file.key}`;
  }
  return `/uploads/${file.filename}`;
};

/**
 * Create content record, find/create its slot, and create the schedule entry.
 * @param {Object} params - Content data
 * @param {Object} file - Multer file object
 * @param {string} userId - Uploader's user ID
 * @returns {Object} Created content with schedule
 */
const createContent = async ({ title, description, subject, start_time, end_time, rotation_duration }, file, userId) => {
  const normalizedSubject = subject.toLowerCase().trim();
  const duration = rotation_duration ? parseInt(rotation_duration, 10) : 5;

  // 1. Create content record
  const content = await Content.create({
    title,
    description: description || null,
    subject: normalizedSubject,
    file_url: buildFileUrl(file),
    file_type: file.mimetype.split('/')[1], // jpg, png, gif
    file_size: file.size,
    uploaded_by: userId,
    status: 'pending',
    start_time: new Date(start_time),
    end_time: new Date(end_time),
  });

  // 2. Find or create ContentSlot for (subject, teacher_id)
  const [slot] = await ContentSlot.findOrCreate({
    where: { subject: normalizedSubject, teacher_id: userId },
    defaults: { subject: normalizedSubject, teacher_id: userId },
  });

  // 3. Get max rotation_order for this slot, increment by 1
  const maxOrder = await ContentSchedule.max('rotation_order', {
    where: { slot_id: slot.id },
  });
  const nextOrder = (maxOrder || 0) + 1;

  // 4. Create ContentSchedule record
  const schedule = await ContentSchedule.create({
    content_id: content.id,
    slot_id: slot.id,
    rotation_order: nextOrder,
    duration,
  });

  // Reload content with schedule info
  const result = await Content.findByPk(content.id, {
    include: [
      {
        model: ContentSchedule,
        as: 'schedule',
        include: [{ model: ContentSlot, as: 'slot' }],
      },
    ],
  });

  return result;
};

/**
 * Get all content by a specific teacher with optional filters.
 * @param {string} userId - Teacher's user ID
 * @param {Object} filters - { subject, status, page, limit }
 * @returns {Object} { data, total, page, limit, totalPages }
 */
const getMyContent = async (userId, { subject, status, page = 1, limit = 10 }) => {
  const where = { uploaded_by: userId };

  if (subject) where.subject = subject.toLowerCase().trim();
  if (status) where.status = status;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows: data, count: total } = await Content.findAndCountAll({
    where,
    include: [
      {
        model: ContentSchedule,
        as: 'schedule',
        attributes: ['rotation_order', 'duration', 'slot_id'],
      },
    ],
    order: [['created_at', 'DESC']],
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
 * Get all content (principal view) with optional filters.
 * @param {Object} filters - { status, subject, teacher_id, page, limit }
 * @returns {Object} { data, total, page, limit, totalPages }
 */
const getAllContent = async ({ status, subject, teacher_id, page = 1, limit = 10 }) => {
  const where = {};

  if (status) where.status = status;
  if (subject) where.subject = subject.toLowerCase().trim();
  if (teacher_id) where.uploaded_by = teacher_id;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows: data, count: total } = await Content.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'email', 'role'],
      },
      {
        model: ContentSchedule,
        as: 'schedule',
        attributes: ['rotation_order', 'duration', 'slot_id'],
      },
    ],
    order: [['created_at', 'DESC']],
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
 * Get live content for a teacher (approved + in time window).
 * @param {string} teacherId
 * @param {string|null} subjectFilter
 * @returns {Array} Filtered content records with schedule info
 */
const getLiveContent = async (teacherId, subjectFilter = null) => {
  const now = new Date();
  const where = {
    uploaded_by: teacherId,
    status: 'approved',
    start_time: { [Op.lte]: now },
    end_time: { [Op.gte]: now },
  };

  if (subjectFilter) {
    where.subject = subjectFilter.toLowerCase().trim();
  }

  const content = await Content.findAll({
    where,
    include: [
      {
        model: ContentSchedule,
        as: 'schedule',
        attributes: ['rotation_order', 'duration', 'slot_id'],
        include: [{ model: ContentSlot, as: 'slot', attributes: ['id', 'subject'] }],
      },
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['subject', 'ASC']],
  });

  return content;
};

module.exports = { createContent, getMyContent, getAllContent, getLiveContent };
