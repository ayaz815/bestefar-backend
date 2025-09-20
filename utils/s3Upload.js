const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

// Sign with RAW key; match ContentType; keep short expiry
const generatePresignedUrl = async (key, contentType = "audio/mpeg") => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key, // raw key (not encoded)
      Expires: 300, // 5 minutes
      ContentType: contentType, // must match client PUT header
      // No ACL here
    };
    return await s3.getSignedUrlPromise("putObject", params);
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    throw new Error("Could not generate pre-signed S3 URL.");
  }
};

// Optional direct upload helper (server-side)
const uploadToS3 = async (buffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName, // raw key
    Body: buffer,
    ContentType: "audio/mpeg",
    // No ACL
  };
  const result = await s3.upload(params).promise();
  return result.Location;
};

// --- ADD: Presign GET (download) URLs for private playback ---
const generatePresignedGetUrl = async (key, expiresSeconds = 300) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key, // raw key (no encode)
      Expires: expiresSeconds, // short-lived GET url
      // You can hint the content-type response:
      ResponseContentType: "audio/mpeg",
      // Optional: force download vs. inline (we want inline):
      // ResponseContentDisposition: 'inline'
    };
    return await s3.getSignedUrlPromise("getObject", params);
  } catch (err) {
    console.error("Error generating pre-signed GET URL:", err);
    throw new Error("Could not generate pre-signed S3 GET URL.");
  }
};

module.exports = { generatePresignedUrl, uploadToS3, generatePresignedGetUrl };
