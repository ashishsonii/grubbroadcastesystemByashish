const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const r2Client = require('./r2');

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB
const USE_R2 = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// File filter — allow only jpg, png, gif
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png, gif files are allowed'), false);
  }
};

// R2 cloud storage (S3-compatible)
const r2Storage = multerS3({
  s3: r2Client,
  bucket: process.env.R2_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `uploads/${Date.now()}-${sanitized}`;
    cb(null, uniqueName);
  },
});

// Local disk storage (fallback)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}-${sanitized}`;
    cb(null, uniqueName);
  },
});

// Log which storage is active on startup
console.log(`📁 File storage: ${USE_R2 ? 'Cloudflare R2 (cloud)' : 'Local disk'}`);

// Multer instance — auto-selects storage based on env
const upload = multer({
  storage: USE_R2 ? r2Storage : diskStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = { upload, USE_R2 };
