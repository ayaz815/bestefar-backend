const express = require("express");
const { saveForm } = require("../controllers/formController");
const multer = require("multer");

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Use multer middleware for handling file uploads in `saveForm`
// router.post("/save-form", upload.single("musicFile"), saveForm);
router.post("/save-form", upload.none(), saveForm);
module.exports = router;
