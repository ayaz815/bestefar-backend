const express = require("express");
const router = express.Router();
const { generatePresignedGetUrl } = require("../utils/s3Upload");

// Build the key either by (type + page) or by explicit fileName
// type: "music" | "audio"
router.get("/s3-get-signed-url", async (req, res) => {
  try {
    const { type, page, fileName } = req.query;

    if (!fileName && !(type && page)) {
      return res
        .status(400)
        .json({ error: "Provide either fileName, or type & page" });
    }

    // 1) Prefer explicit fileName if provided (raw, not encoded)
    //    e.g. musicFiles/music3.mp3 or audioFiles/audio5.mp3
    let key;
    if (fileName) {
      // If caller passes a folder-less name, infer prefix from type when possible
      if (fileName.includes("/")) {
        key = fileName;
      } else if (type === "music") {
        key = `musicFiles/${fileName}`;
      } else if (type === "audio") {
        key = `audioFiles/${fileName}`;
      } else {
        // fallback: assume caller passed full key; if not, this will 403 on use
        key = fileName;
      }
    } else {
      // 2) Compute by convention from type+page (matches your upload naming)
      const p = parseInt(page, 10);
      if (!["music", "audio"].includes(type) || Number.isNaN(p)) {
        return res.status(400).json({ error: "Invalid type or page" });
      }
      const base = type === "music" ? `music${p}.mp3` : `audio${p}.mp3`;
      key = type === "music" ? `musicFiles/${base}` : `audioFiles/${base}`;
    }

    const url = await generatePresignedGetUrl(key, 300);
    return res.json({ url, key });
  } catch (err) {
    console.error("Failed to presign GET URL:", err);
    return res.status(500).json({ error: "Failed to generate playback URL" });
  }
});

module.exports = router;
