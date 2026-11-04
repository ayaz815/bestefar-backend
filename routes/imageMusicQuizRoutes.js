// routes/imageMusicRoutes.js
const express = require("express");
const multer = require("multer");
const {
  saveImageMusicForm,
  getAllImageMusicShows,
  getImageMusicShowById,
  updateImageMusicShow,
  deleteImageMusicShow,
} = require("../controllers/imageMusicController");

const { getImageMusicPdf } = require("../controllers/pdfController");
const requirePlayKey = require("../middleware/requirePlayKey");

const requireAdmin = require("../middleware/requireAdmin");

const { signMediaInResponse, stripMediaInBody } = require("../utils/privateMedia");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/save-image-music-form", requireAdmin, upload.none(), stripMediaInBody, saveImageMusicForm);
// Only the website catalog links here, so it needs a play key.
router.get("/pdf/:id", requirePlayKey("imagemusic"), getImageMusicPdf);
router.get("/get-all-image-music-shows", signMediaInResponse, getAllImageMusicShows);
router.get("/get-image-music-show/:id", requireAdmin, signMediaInResponse, getImageMusicShowById);
router.put("/update-image-music-show/:id", requireAdmin, upload.none(), stripMediaInBody, updateImageMusicShow);
router.delete("/delete-image-music-show/:id", requireAdmin, deleteImageMusicShow);

module.exports = router;
