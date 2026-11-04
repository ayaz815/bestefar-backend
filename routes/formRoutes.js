const express = require("express");
const {
  saveForm,
  getAllShows,
  getShowById,
  updateShow,
  deleteShow,
} = require("../controllers/formController");
const { getAudioQuizPdf } = require("../controllers/pdfController");
const requirePlayKey = require("../middleware/requirePlayKey");
const multer = require("multer");

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Use multer middleware for handling file uploads in `saveForm`
router.post("/save-form", upload.none(), saveForm);
router.get("/get-all", getAllShows);
router.get("/get-show/:id", getShowById);
router.put("/update-show/:id", updateShow);
router.delete("/delete-show/:id", deleteShow);
// Only the website catalog links here, so it needs a play key.
router.get("/pdf/:id", requirePlayKey("audio"), getAudioQuizPdf);

module.exports = router;
