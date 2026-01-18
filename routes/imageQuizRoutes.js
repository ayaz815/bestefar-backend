const express = require("express");
const {
  saveImageQuizForm,
  getAllImageQuizzes,
  getImageQuizById,
  updateImageQuiz,
  deleteImageQuiz,
} = require("../controllers/imageQuizController");
const multer = require("multer");

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Test route to verify routes are working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Image quiz routes are working!",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "POST /save-image-quiz-form",
      "GET /get-all-image-quizzes",
      "GET /get-image-quiz/:id",
      "PUT /update-image-quiz/:id",
      "DELETE /delete-image-quiz/:id",
    ],
  });
});

// ✅ These routes work perfectly with the unified media system
// They receive mediaFileName, mediaFileUrl, and mediaType from the frontend
// No changes needed here!
router.post("/save-image-quiz-form", upload.none(), saveImageQuizForm);
router.get("/get-all-image-quizzes", getAllImageQuizzes);
router.get("/get-image-quiz/:id", getImageQuizById);
router.put("/update-image-quiz/:id", updateImageQuiz);
router.delete("/delete-image-quiz/:id", deleteImageQuiz);

module.exports = router;
