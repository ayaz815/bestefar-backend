const mongoose = require("mongoose");
const Quiz = require("../models/Form");
const ImageQuiz = require("../models/ImageQuiz");
const ImageMusic = require("../models/ImageMusicQuiz");

// Crosswords are left out until the generator is fully working (client, 2 Nov 2026).
const MODELS = { audio: Quiz, image: ImageQuiz, imagemusic: ImageMusic };
const TIERS = ["restricted", "registered", "demo"];

const findModel = (type, id, res) => {
  const Model = MODELS[type];
  if (!Model) {
    res.status(400).json({ error: "Unknown quiz type" });
    return null;
  }
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: "Show not found" });
    return null;
  }
  return Model;
};

// GET /api/access-tier/:type/:id -> { accessTier }
const getAccessTier = async (req, res) => {
  try {
    const Model = findModel(req.params.type, req.params.id, res);
    if (!Model) return;
    const doc = await Model.findById(req.params.id).select("accessTier");
    if (!doc) return res.status(404).json({ error: "Show not found" });
    res.json({ accessTier: doc.accessTier || "restricted" });
  } catch (err) {
    console.error("getAccessTier:", err);
    res.status(500).json({ error: "Failed to read access tier" });
  }
};

// PUT /api/access-tier/:type/:id  { accessTier }
// Only touches this one field, like the visibility endpoint.
const setAccessTier = async (req, res) => {
  try {
    const Model = findModel(req.params.type, req.params.id, res);
    if (!Model) return;
    if (!TIERS.includes(req.body.accessTier)) {
      return res.status(400).json({ error: `accessTier must be one of: ${TIERS.join(", ")}` });
    }
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { accessTier: req.body.accessTier } },
      { new: true, runValidators: false, timestamps: false }
    ).select("accessTier");
    if (!doc) return res.status(404).json({ error: "Show not found" });
    res.json({ success: true, accessTier: doc.accessTier });
  } catch (err) {
    console.error("setAccessTier:", err);
    res.status(500).json({ error: "Failed to update access tier" });
  }
};

module.exports = { getAccessTier, setAccessTier, TIERS };
