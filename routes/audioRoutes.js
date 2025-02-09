const express = require("express");
const multer = require("multer");
const { uploadAudio } = require("../controllers/audioController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route for uploading audio files
router.post("/upload-audio/:page", upload.single("audioFile"), uploadAudio);

module.exports = router;
