const express = require("express");
const { generatePresignedUrl } = require("../utils/s3Upload");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/s3-presigned-url", requireAdmin, async (req, res) => {
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

    // Every upload gets its own key. The key used to be just the original
    // filename, so two uploads with the same name (different pages, or
    // different quizzes - e.g. a re-exported "melody.mp3") overwrote one
    // S3 object and every page pointing at it played the last upload.
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${fileName}`;
    const rawKey = `${type}Files/${uniqueName}`;
    const url = await generatePresignedUrl(rawKey, contentType);
    const encodedKey = `${type}Files/${encodeURIComponent(uniqueName)}`;
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
