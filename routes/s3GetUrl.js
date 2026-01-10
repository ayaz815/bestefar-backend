const express = require("express");
const router = express.Router();
const { generatePresignedGetUrl } = require("../utils/s3Upload");

// Route is now: /api/s3/download/signed-url
router.get("/signed-url", async (req, res) => {
  try {
    const { type, page, fileName } = req.query;

    console.log("📥 Download URL request:", { type, page, fileName });

    if (!fileName && !(type && page)) {
      return res
        .status(400)
        .json({ error: "Provide either fileName, or type & page" });
    }

    // 1) Prefer explicit fileName if provided (raw, not encoded)
    let key;
    if (fileName) {
      // If caller passes a folder-less name, infer prefix from type when possible
      if (fileName.includes("/")) {
        key = fileName;
      } else if (type === "music") {
        key = `musicFiles/${fileName}`;
      } else if (type === "audio") {
        key = `audioFiles/${fileName}`;
      } else if (type === "image") {
        key = `imageFiles/${fileName}`;
      } else {
        // fallback: assume caller passed full key; if not, this will 403 on use
        key = fileName;
      }
    } else {
      // 2) Compute by convention from type+page (matches your upload naming)
      const p = parseInt(page, 10);
      if (!["music", "audio", "image"].includes(type) || Number.isNaN(p)) {
        return res.status(400).json({ error: "Invalid type or page" });
      }

      let base;
      if (type === "music") {
        base = `music${p}.mp3`;
        key = `musicFiles/${base}`;
      } else if (type === "audio") {
        base = `audio${p}.mp3`;
        key = `audioFiles/${base}`;
      } else if (type === "image") {
        base = `image${p}.jpg`; // default extension, actual may vary
        key = `imageFiles/${base}`;
      }
    }

    const url = await generatePresignedGetUrl(key, 300);

    console.log("✅ Generated download URL for:", key);

    return res.json({ url, key });
  } catch (err) {
    console.error("❌ Failed to presign GET URL:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate playback URL", details: err.message });
  }
});

module.exports = router;
