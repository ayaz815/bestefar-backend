const express = require("express");
const { generateZip } = require("../controllers/zipController");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Route to download ZIP file
router.get("/download-zip", requireAdmin, generateZip);

module.exports = router;
