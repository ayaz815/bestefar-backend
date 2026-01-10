const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/imageController");

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Route for uploading image files
router.post("/upload-image/:page", upload.single("imageFile"), uploadImage);

module.exports = router;
