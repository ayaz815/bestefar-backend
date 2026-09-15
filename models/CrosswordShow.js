const mongoose = require("mongoose");

const PlacedWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    // Not every word needs a clue in the UI (bare words are valid, e.g. via
    // bulk paste) — requiring it here rejected the whole save whenever any
    // placed word had an empty clue.
    clue: { type: String, default: "" },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    direction: { type: String, enum: ["across", "down"], required: true },
    number: { type: Number, required: true },
  },
  { _id: false }
);

const CrosswordShowSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, trim: true },
    quizType: { type: String, default: "crossword" },
    words: [{ word: String, clue: String }], // raw input, max 50
    grid: [[{ type: String, default: null }]], // 15x15, null = black
    placedWords: [PlacedWordSchema],
    totalWords: { type: Number, default: 0 },
    // The frontend has always sent this as a plain number (11 or 13 — the
    // actual template size), but this was previously typed as a {rows,cols}
    // object, so every save silently discarded the real value and stored
    // the object's defaults instead. Mixed here (rather than switching
    // straight to Number) so existing saved shows that already have the old
    // {rows,cols} shape keep loading correctly — only new saves start
    // storing the real number.
    gridSize: { type: mongoose.Schema.Types.Mixed, default: 11 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CrosswordShow", CrosswordShowSchema);
