const express = require("express");
const { generatePresignedUrl } = require("../utils/s3Upload");

const router = express.Router();

router.get("/s3-presigned-url", async (req, res) => {
  try {
    const { fileName, contentType, type, page } = req.query;
    if (!fileName || !type || !page) {
      return res.status(400).json({ error: "Missing required query params" });
    }

    // 1) Use RAW key for signing (NO encode here)
    const rawKey = `${type}Files/${fileName}`;

    // 2) Presign PUT with explicit ContentType + short expiry
    const url = await generatePresignedUrl(rawKey, contentType);

    // 3) Build public URL for GET (encode ONLY for URL)
    const encodedKey = `${type}Files/${encodeURIComponent(fileName)}`;
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

    res.json({ url, publicUrl, key: rawKey });
  } catch (err) {
    console.error("Failed to generate pre-signed URL:", err);
    res.status(500).json({ error: "Failed to generate S3 URL" });
  }
});

module.exports = router;
