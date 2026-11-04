const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const { login, previewKey } = require("../controllers/adminController");

const router = express.Router();

router.post("/login", login);
router.get("/preview-key/:type/:id", requireAdmin, previewKey);

module.exports = router;
