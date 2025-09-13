// routes/zipRoutes.js
const express = require("express");
const {
  downloadIndexHtml,
  downloadDataZip,
} = require("../controllers/zipController");

const router = express.Router();

// RAW index.html (not zipped)
router.get("/download-index", downloadIndexHtml);

// ONLY data/ folder zipped as data.zip
router.get("/download-zip", downloadDataZip);

module.exports = router;
