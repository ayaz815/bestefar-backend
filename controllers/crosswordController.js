const CrosswordShow = require("../models/Crosswordshow");

// ── helpers ────────────────────────────────────────────────────────────────
const clean = (doc) => ({
  id: doc._id.toString(),
  quizName: doc.quizName,
  quizType: doc.quizType,
  words: doc.words,
  grid: doc.grid,
  placedWords: doc.placedWords,
  totalWords: doc.totalWords,
  gridSize: doc.gridSize,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// ── POST /api/crossword/create ─────────────────────────────────────────────
exports.createCrossword = async (req, res) => {
  try {
    const { quizName, words, grid, placedWords, totalWords } = req.body;
    if (!quizName)
      return res.status(400).json({ message: "quizName required" });

    const doc = await CrosswordShow.create({
      quizName,
      words: words || [],
      grid: grid || [],
      placedWords: placedWords || [],
      totalWords: totalWords || 0,
    });

    res.status(201).json({ success: true, data: clean(doc) });
  } catch (err) {
    console.error("createCrossword:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/crossword/:id ─────────────────────────────────────────────────
exports.updateCrossword = async (req, res) => {
  try {
    const doc = await CrosswordShow.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data: clean(doc) });
  } catch (err) {
    console.error("updateCrossword:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/crossword/all ─────────────────────────────────────────────────
exports.getAllCrosswords = async (req, res) => {
  try {
    const docs = await CrosswordShow.find()
      .sort({ createdAt: -1 })
      .select(
        "quizName quizType totalWords placedWords gridSize createdAt updatedAt"
      );
    res.json({ success: true, data: docs.map(clean) });
  } catch (err) {
    console.error("getAllCrosswords:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/crossword/:id ─────────────────────────────────────────────────
exports.getCrosswordById = async (req, res) => {
  try {
    const doc = await CrosswordShow.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data: clean(doc) });
  } catch (err) {
    console.error("getCrosswordById:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/crossword/:id ──────────────────────────────────────────────
exports.deleteCrossword = async (req, res) => {
  try {
    const doc = await CrosswordShow.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteCrossword:", err);
    res.status(500).json({ message: err.message });
  }
};
