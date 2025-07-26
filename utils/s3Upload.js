const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

const generatePresignedUrl = async (key, contentType = "audio/mpeg") => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Expires: 300,
      ContentType: contentType,
      // ACL: "public-read",
    };

    return await s3.getSignedUrlPromise("putObject", params);
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    throw new Error("Could not generate pre-signed S3 URL.");
  }
};

const uploadToS3 = async (buffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "audio/mpeg",
    ACL: "public-read",
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = {
  generatePresignedUrl,
  uploadToS3,
};
