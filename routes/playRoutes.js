const express = require("express");
const requirePlayKey = require("../middleware/requirePlayKey");
const { getAudioQuizById } = require("../controllers/audioQuizController");
const { getImageQuizById } = require("../controllers/imageQuizController");
const { getImageMusicShowById } = require("../controllers/imageMusicController");
const { getAudioQuizPdf, getImageQuizPdf, getImageMusicPdf } = require("../controllers/pdfController");

// Read-only routes the players and the catalog's PDF buttons use. Each one needs a
// play key once ACCESS_ENFORCE is on. The generator keeps using its own routes.
//   GET /api/play/:type/:id       show content for the player
//   GET /api/play/:type/:id/pdf   printable PDF
const HANDLERS = {
  audio: { show: getAudioQuizById, pdf: getAudioQuizPdf },
  image: { show: getImageQuizById, pdf: getImageQuizPdf },
  imagemusic: { show: getImageMusicShowById, pdf: getImageMusicPdf },
};

const router = express.Router();

for (const [type, handler] of Object.entries(HANDLERS)) {
  router.get(`/${type}/:id`, requirePlayKey(type), handler.show);
  router.get(`/${type}/:id/pdf`, requirePlayKey(type), handler.pdf);
}

module.exports = router;
module.exports.HANDLERS = HANDLERS;
