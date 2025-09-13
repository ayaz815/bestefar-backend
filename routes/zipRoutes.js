const express = require("express");
const {
  sendIndexFile,
  sendDataZip,
} = require("../controllers/download.controller");

const router = express.Router();

// Route to download index.html as a file
router.get("/download/index", sendIndexFile);

// Route to download data/ folder as a ZIP
router.get("/download/data-zip", sendDataZip);

module.exports = router;
