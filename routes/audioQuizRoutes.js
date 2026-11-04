const express = require("express");
const {
  saveAudioQuizForm,
  getAllAudioQuizzes,
  getAudioQuizById,
  updateAudioQuiz,
  deleteAudioQuiz,
} = require("../controllers/audioQuizController");
const multer = require("multer");
const requirePlayKey = require("../middleware/requirePlayKey");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Test route to verify routes are working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Audio quiz routes are working!",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "POST /save-audio-quiz-form",
      "GET /get-all-audio-quizzes",
      "GET /get-audio-quiz/:id",
      "PUT /update-audio-quiz/:id",
      "DELETE /delete-audio-quiz/:id",
    ],
  });
});

// Routes for audio quiz CRUD operations
router.post("/save-audio-quiz-form", requireAdmin, upload.none(), saveAudioQuizForm);
router.get("/get-all-audio-quizzes", getAllAudioQuizzes);
// Player-only route (the generator uses /api/forms/get-show), so it needs a play key.
router.get("/get-audio-quiz/:id", requirePlayKey("audio"), getAudioQuizById);
router.put("/update-audio-quiz/:id", requireAdmin, updateAudioQuiz);
router.delete("/delete-audio-quiz/:id", requireAdmin, deleteAudioQuiz);

module.exports = router;
