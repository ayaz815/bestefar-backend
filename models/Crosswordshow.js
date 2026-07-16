const mongoose = require("mongoose");

const PlacedWordSchema = new mongoose.Schema({
  word:      { type: String, required: true },
  clue:      { type: String, required: true },
  row:       { type: Number, required: true },
  col:       { type: Number, required: true },
  direction: { type: String, enum: ["across", "down"], required: true },
  number:    { type: Number, required: true },
}, { _id: false });

const CrosswordShowSchema = new mongoose.Schema(
  {
    quizName:    { type: String, required: true, trim: true },
    quizType:    { type: String, default: "crossword" },
    words:       [{ word: String, clue: String }], // raw input, max 50
    grid:        [[{ type: String, default: null }]], // 15x15, null = black
    placedWords: [PlacedWordSchema],
    totalWords:  { type: Number, default: 0 },
    gridSize:    { rows: { type: Number, default: 15 }, cols: { type: Number, default: 15 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CrosswordShow", CrosswordShowSchema);