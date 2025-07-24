const express = require("express");
const { generatePresignedUrl } = require("../utils/s3Upload");

const router = express.Router();

router.get("/s3-presigned-url", async (req, res) => {
  try {
    const { fileName, contentType, type, page } = req.query;
    if (!fileName || !type || !page) {
      return res.status(400).json({ error: "Missing required query params" });
    }

    // const key = `${type}Files/${type}${page}.mp3`;
    const key = `${type}Files/${encodeURIComponent(fileName)}`;
    const url = await generatePresignedUrl(key, contentType);

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ url, publicUrl });
  } catch (err) {
    console.error("Failed to generate pre-signed URL:", err);
    res.status(500).json({ error: "Failed to generate S3 URL" });
  }
});

module.exports = router;
