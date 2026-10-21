const express = require("express");
const {
  getVisibility,
  setVisibility,
} = require("../controllers/visibilityController");

const router = express.Router();

router.get("/:type/:id", getVisibility);
router.put("/:type/:id", setVisibility);

module.exports = router;
