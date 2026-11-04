const express = require("express");
const multer = require("multer");
const { uploadAudio } = require("../controllers/audioController");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route for uploading audio files
router.post("/upload-audio/:page", requireAdmin, upload.single("audioFile"), uploadAudio);

module.exports = router;
