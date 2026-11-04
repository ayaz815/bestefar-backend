const express = require("express");
const {
  getVisibility,
  setVisibility,
} = require("../controllers/visibilityController");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/:type/:id", getVisibility);
router.put("/:type/:id", requireAdmin, setVisibility);

module.exports = router;
