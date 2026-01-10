const mongoose = require("mongoose");

const ImageScreenSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 1, max: 16 },
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
    imageFileName: { type: String, trim: true },
    imageFileUrl: { type: String, trim: true },
    imageCaption: { type: String, trim: true },
    imageQuestionType: {
      type: String,
      enum: ["bit-by-bit", "single-question", "multiple-questions"],
      default: "single-question",
    },
    bitSize: {
      type: String,
      enum: ["1", "2", "3"],
      default: "1",
    },
    selectedAnswer: { type: String, trim: true },
    audioFileName: { type: String, trim: true },
    audioFileUrl: { type: String, trim: true },
    additionalNotes: { type: String },
  },
  { _id: false }
);

const ImageQuizSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, trim: true },
    quizType: { type: String, default: "image", immutable: true },
    screens: {
      type: [ImageScreenSchema],
      validate: [arrayLimit, "{PATH} exceeds the limit of 16 screens"],
    },
  },
  {
    timestamps: true,
    collection: "imagequizzes",
  }
);

function arrayLimit(val) {
  return val.length <= 16;
}

ImageQuizSchema.index({ quizName: 1 });
ImageQuizSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ImageQuiz", ImageQuizSchema);
