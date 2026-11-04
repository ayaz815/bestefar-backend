const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const {
  createCrossword,
  updateCrossword,
  getAllCrosswords,
  getCrosswordById,
  deleteCrossword,
} = require("../controllers/crosswordController");

const { getCrosswordPdf } = require("../controllers/pdfController");

router.post("/create", requireAdmin, createCrossword);
router.get("/pdf/:id", getCrosswordPdf);
router.get("/all", getAllCrosswords);
router.get("/:id", requireAdmin, getCrosswordById);
router.put("/:id", requireAdmin, updateCrossword);
router.delete("/:id", requireAdmin, deleteCrossword);

module.exports = router;
