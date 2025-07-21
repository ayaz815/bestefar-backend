const mongoose = require("mongoose");

const ScreenSchema = new mongoose.Schema({
  page: { type: Number, required: true },
  question: String,
  answer: String,
  firmNaming: String,
  musicName: String,
  artistName: String,
  musicFileName: String,
  audioFileName: String,
  musicFileUrl: String,
  audioFileUrl: String,
  additionalNotes: String,
});

const QuizSchema = new mongoose.Schema({
  quizName: { type: String, required: true },
  screens: [ScreenSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", QuizSchema);
