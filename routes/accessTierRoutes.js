const express = require("express");
const { getAccessTier, setAccessTier } = require("../controllers/accessTierController");

const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/:type/:id", getAccessTier);
router.put("/:type/:id", requireAdmin, setAccessTier);

module.exports = router;
