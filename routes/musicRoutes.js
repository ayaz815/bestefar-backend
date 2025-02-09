const express = require("express");
const multer = require("multer");
const { uploadMusic } = require("../controllers/musicController");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-music/:page", upload.single("file"), uploadMusic);

module.exports = router;
