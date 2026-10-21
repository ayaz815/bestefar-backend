const mongoose = require("mongoose");
const Quiz = require("../models/Form");
const ImageQuiz = require("../models/ImageQuiz");
const ImageMusic = require("../models/ImageMusicQuiz");
const CrosswordShow = require("../models/CrosswordShow");

// Generator quizType -> model. Same keys the frontend already uses.
const MODELS = {
  audio: Quiz,
  image: ImageQuiz,
  imagemusic: ImageMusic,
  crossword: CrosswordShow,
};

const findModel = (type, id, res) => {
  const Model = MODELS[type];
  if (!Model) res.status(400).json({ error: "Unknown quiz type" });
  else if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: "Show not found" });
    return null;
  }
  return Model;
};

// GET /api/visibility/:type/:id -> { isPublic }
const getVisibility = async (req, res) => {
  try {
    const Model = findModel(req.params.type, req.params.id, res);
    if (!Model) return;
    const doc = await Model.findById(req.params.id).select("isPublic");
    if (!doc) return res.status(404).json({ error: "Show not found" });
    res.json({ isPublic: doc.isPublic !== false });
  } catch (err) {
    console.error("getVisibility:", err);
    res.status(500).json({ error: "Failed to read visibility" });
  }
};

// PUT /api/visibility/:type/:id  { isPublic: boolean }
// Only touches the flag, so it can't clobber a half-finished quiz's pages.
const setVisibility = async (req, res) => {
  try {
    const Model = findModel(req.params.type, req.params.id, res);
    if (!Model) return;
    if (typeof req.body.isPublic !== "boolean") {
      return res.status(400).json({ error: "isPublic must be true or false" });
    }
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { isPublic: req.body.isPublic } },
      { new: true, runValidators: false, timestamps: false }
    ).select("isPublic");
    if (!doc) return res.status(404).json({ error: "Show not found" });
    res.json({ success: true, isPublic: doc.isPublic });
  } catch (err) {
    console.error("setVisibility:", err);
    res.status(500).json({ error: "Failed to update visibility" });
  }
};

module.exports = { getVisibility, setVisibility };
