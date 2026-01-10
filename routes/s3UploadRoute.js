const express = require("express");
const { generatePresignedUrl } = require("../utils/s3Upload");

const router = express.Router();

router.get("/s3-presigned-url", async (req, res) => {
  try {
    const { fileName, contentType, type, page } = req.query;

    if (!fileName || !type || !page) {
      return res
        .status(400)
        .json({ error: "Missing required query params: fileName, type, page" });
    }

    if (!["music", "audio", "image"].includes(type)) {
      return res.status(400).json({
        error: "Invalid type. Must be music, audio, or image",
      });
    }

    const rawKey = `${type}Files/${fileName}`;
    const url = await generatePresignedUrl(rawKey, contentType);
    const encodedKey = `${type}Files/${encodeURIComponent(fileName)}`;
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

    res.json({ url, publicUrl, key: rawKey });
  } catch (err) {
    console.error("Failed to generate pre-signed URL:", err);
    res
      .status(500)
      .json({ error: "Failed to generate S3 URL", details: err.message });
  }
});

module.exports = router;
