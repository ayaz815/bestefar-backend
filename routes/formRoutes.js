const express = require("express");
const { saveForm } = require("../controllers/formController");
const multer = require("multer");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Use multer middleware for handling file uploads in `saveForm`
router.post("/save-form", upload.single("musicFile"), saveForm);

module.exports = router;
