const { validationResult } = require('express-validator');
const contentService = require('../services/content.service');
const schedulingService = require('../services/scheduling.service');
const { User } = require('../models');
const redis = require('../config/redis');
const { success, error } = require('../utils/response.util');

/**
 * POST /api/content/upload
 * Upload content (teacher only). Multipart form-data.
 */
const uploadContent = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed.', 400, errors.array().map((e) => e.msg));
    }

    // File is required
    if (!req.file) {
      return error(res, 'File is required.', 400, ['Please upload an image file (jpg, png, gif).']);
    }

    const { title, subject, description, start_time, end_time, rotation_duration } = req.body;

    // Validate start_time < end_time
    if (new Date(start_time) >= new Date(end_time)) {
      return error(res, 'Validation failed.', 400, ['start_time must be before end_time.']);
    }

    const content = await contentService.createContent(
      { title, subject, description, start_time, end_time, rotation_duration },
      req.file,
      req.user.id
    );

    return success(res, content, 'Content uploaded successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/content/my
 * Get all content uploaded by the logged-in teacher.
 */
const getMyContent = async (req, res, next) => {
  try {
    const { subject, status, page, limit } = req.query;

    const result = await contentService.getMyContent(req.user.id, {
      subject,
      status,
      page: page || 1,
      limit: limit || 10,
    });

    return success(res, result, 'Content retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/content/all
 * Get all content from all teachers (principal only).
 */
const getAllContent = async (req, res, next) => {
  try {
    const { status, subject, teacher_id, page, limit } = req.query;

    const result = await contentService.getAllContent({
      status,
      subject,
      teacher_id,
      page: page || 1,
      limit: limit || 10,
    });

    return success(res, result, 'All content retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/content/live/:teacherId
 * PUBLIC endpoint — no auth required.
 * Returns the currently active content for a teacher based on rotation logic.
 */
const getLiveContent = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    const cacheKey = `live_content:${teacherId}:${subject || 'all'}`;

    // 1. Try fetching from Redis first (graceful fallback if Redis is down)
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`🚀 Cache Hit for key: ${cacheKey}`);
        return success(res, JSON.parse(cachedData), 'Currently active content (from cache).');
      }
      console.log(`⏳ Cache Miss for key: ${cacheKey}. Hitting DB...`);
    } catch (redisErr) {
      console.warn(`⚠️ Redis GET Error (falling back to DB): ${redisErr.message}`);
    }

    // 2. Validate teacherId exists and is a teacher
    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return success(res, null, 'No content available.');
    }

    // 3. Get all approved, in-time-window content for this teacher
    const content = await contentService.getLiveContent(teacherId, subject || null);

    // 4. If no content → return empty
    if (!content || content.length === 0) {
      return success(res, null, 'No content available.');
    }

    // 5. Group content by subject
    const groupedBySubject = {};
    for (const item of content) {
      const subj = item.subject;
      if (!groupedBySubject[subj]) {
        groupedBySubject[subj] = [];
      }
      groupedBySubject[subj].push(item);
    }

    // 6. For each subject group, apply rotation logic
    const currentTime = new Date();
    const activeContent = {};

    for (const [subj, items] of Object.entries(groupedBySubject)) {
      const active = schedulingService.getActiveContent(items, currentTime);
      if (active) {
        activeContent[subj] = active;
      }
    }

    // 7. If subject filter provided → return only that subject's active content
    if (subject) {
      const subjectLower = subject.toLowerCase().trim();
      const subjectActive = activeContent[subjectLower] || null;
      if (!subjectActive) {
        return success(res, null, 'No content available.');
      }
      
      // Save to cache before returning (15 second TTL)
      try {
        await redis.setex(cacheKey, 15, JSON.stringify(subjectActive));
      } catch (redisErr) {
        console.warn(`⚠️ Redis SET Error: ${redisErr.message}`);
      }
      
      return success(res, subjectActive, `Currently active content for ${subjectLower}.`);
    }

    // 8. Save to cache before returning (15 second TTL)
    try {
      await redis.setex(cacheKey, 15, JSON.stringify(activeContent));
    } catch (redisErr) {
      console.warn(`⚠️ Redis SET Error: ${redisErr.message}`);
    }
    
    // 9. Return all active content grouped by subject
    return success(res, activeContent, 'Currently active content.');
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadContent, getMyContent, getAllContent, getLiveContent };
