const express = require("express");
const router = express.Router();
const {
  createCrossword,
  updateCrossword,
  getAllCrosswords,
  getCrosswordById,
  deleteCrossword,
} = require("../controllers/crosswordController");

router.post("/create", createCrossword);
router.get("/all", getAllCrosswords);
router.get("/:id", getCrosswordById);
router.put("/:id", updateCrossword);
router.delete("/:id", deleteCrossword);

module.exports = router;
