const express = require("express");
const multer = require("multer");
const { uploadMusic } = require("../controllers/musicController");

const router = express.Router();

// Use in-memory storage (no local disk access)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-music/:page", upload.single("musicFile"), uploadMusic);

module.exports = router;
