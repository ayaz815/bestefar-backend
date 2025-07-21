const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadToS3(fileBuffer, originalName, folder = "") {
  const fileName = `${folder}${uuidv4()}-${originalName}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ACL: "public-read", // or private if needed
  };

  const data = await s3.upload(params).promise();
  return data.Location; // returns the URL of uploaded file
}

module.exports = uploadToS3;
