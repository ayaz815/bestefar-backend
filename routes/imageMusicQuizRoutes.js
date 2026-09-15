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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/save-image-music-form", upload.none(), saveImageMusicForm);
router.get("/get-all-image-music-shows", getAllImageMusicShows);
router.get("/get-image-music-show/:id", getImageMusicShowById);
router.put("/update-image-music-show/:id", upload.none(), updateImageMusicShow);
router.delete("/delete-image-music-show/:id", deleteImageMusicShow);

module.exports = router;
