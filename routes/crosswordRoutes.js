const express = require("express");
const router = express.Router();
const {
  createCrossword,
  updateCrossword,
  getAllCrosswords,
  getCrosswordById,
  deleteCrossword,
} = require("../controllers/crosswordController");

const { getCrosswordPdf } = require("../controllers/pdfController");

router.post("/create", createCrossword);
router.get("/pdf/:id", getCrosswordPdf);
router.get("/all", getAllCrosswords);
router.get("/:id", getCrosswordById);
router.put("/:id", updateCrossword);
router.delete("/:id", deleteCrossword);

module.exports = router;
