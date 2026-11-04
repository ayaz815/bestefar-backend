const express = require("express");
const {
  saveImageQuizForm,
  getAllImageQuizzes,
  getImageQuizById,
  updateImageQuiz,
  deleteImageQuiz,
} = require("../controllers/imageQuizController");
const { getImageQuizPdf } = require("../controllers/pdfController");
const requirePlayKey = require("../middleware/requirePlayKey");
const multer = require("multer");

const requireAdmin = require("../middleware/requireAdmin");

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
router.post("/save-image-quiz-form", requireAdmin, upload.none(), saveImageQuizForm);
router.get("/get-all-image-quizzes", getAllImageQuizzes);
router.get("/get-image-quiz/:id", requireAdmin, getImageQuizById);
router.put("/update-image-quiz/:id", requireAdmin, updateImageQuiz);
router.delete("/delete-image-quiz/:id", requireAdmin, deleteImageQuiz);
// Only the website catalog links here, so it needs a play key.
router.get("/pdf/:id", requirePlayKey("image"), getImageQuizPdf);

module.exports = router;
