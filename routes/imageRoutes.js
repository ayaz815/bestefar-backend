const express = require("express");
const multer = require("multer");
const { uploadMedia } = require("../controllers/uploadMediaController");

const router = express.Router();

// ✅ Configure multer for in-memory storage with support for both images and videos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (good for videos)
  },
  fileFilter: (req, file, cb) => {
    // Accept both images and videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// ✅ MAIN ROUTE - Unified endpoint for both images and videos
router.post("/upload-media/:page", upload.single("mediaFile"), uploadMedia);

// ✅ BACKWARD COMPATIBILITY - Keep old route name but use new controller
// This allows existing frontend code to work without changes
router.post("/upload-image/:page", upload.single("mediaFile"), uploadMedia);

module.exports = router;
