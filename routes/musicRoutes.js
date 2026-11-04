const express = require("express");
const multer = require("multer");
const { uploadMusic } = require("../controllers/musicController");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-music/:page", requireAdmin, upload.single("musicFile"), uploadMusic);

module.exports = router;
