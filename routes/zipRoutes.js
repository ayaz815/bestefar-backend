const express = require("express");
const { generateZip } = require("../controllers/zipController");

const router = express.Router();

// Route to download ZIP file
router.get("/download-zip", generateZip);

module.exports = router;
