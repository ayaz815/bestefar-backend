const mongoose = require("mongoose");

const ScreenSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 1, max: 16 }, // restrict page range
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
    firmNaming: { type: String, trim: true },
    musicName: { type: String, trim: true },
    artistName: { type: String, trim: true },
    musicFileName: { type: String, trim: true },
    audioFileName: { type: String, trim: true },
    musicFileUrl: { type: String, trim: true },
    audioFileUrl: { type: String, trim: true },
    additionalNotes: { type: String }, // usually HTML or plain text
  },
  { _id: false }
); // avoid auto-generating _id for subdocs

const QuizSchema = new mongoose.Schema({
  quizName: { type: String, required: true, trim: true },
  screens: {
    type: [ScreenSchema],
    validate: [arrayLimit, "{PATH} exceeds the limit of 16 screens"],
  },
  createdAt: { type: Date, default: Date.now },
});

// Optional validation to enforce max 16 screens
function arrayLimit(val) {
  return val.length <= 16;
}

module.exports = mongoose.model("Quiz", QuizSchema);
