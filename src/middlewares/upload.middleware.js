const { upload } = require('../config/multer');

/**
 * Upload Middleware — single file upload under field name 'file'.
 * Delegates to multer instance configured in config/multer.js.
 * Automatically uses Cloudflare R2 if credentials are set, otherwise local disk.
 */
const uploadSingle = upload.single('file');

module.exports = { uploadSingle };
