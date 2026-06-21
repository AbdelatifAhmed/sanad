const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configuration - Ensure these are in your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary via a stream.
 * @param {Buffer} fileBuffer - The file buffer from Multer.
 * @param {String} folder - The destination folder on Cloudinary.
 * @returns {Promise<Object>} Resolves with the Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary using its public_id.
 * @param {String} public_id - The Cloudinary public_id.
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return null;
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
