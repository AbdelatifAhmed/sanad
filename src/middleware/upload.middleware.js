const multer = require("multer");

// Use Memory Storage so files are not saved to the local disk
const storage = multer.memoryStorage();

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware helpers
const uploadMiddleware = {
  /**
   * Parse a single file
   * @param {String} fieldName 
   */
  single: (fieldName) => upload.single(fieldName),
  
  /**
   * Parse multiple files from a single field
   * @param {String} fieldName 
   * @param {Number} maxCount 
   */
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  /**
   * Parse multiple files from different fields
   * @param {Array<{name: String, maxCount: Number}>} fields 
   */
  fields: (fields) => upload.fields(fields),
};

module.exports = uploadMiddleware;
