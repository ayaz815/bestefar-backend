const express = require("express");
const { getAccessTier, setAccessTier } = require("../controllers/accessTierController");

const router = express.Router();

router.get("/:type/:id", getAccessTier);
router.put("/:type/:id", setAccessTier);

module.exports = router;
