const mongoose = require("mongoose");

const ImageScreenSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 1, max: 16 },
    question: { type: String, trim: true },
    answer: { type: String, trim: true },

    // ✅ UNIFIED media fields (handles both image and video)
    mediaFileName: { type: String, trim: true },
    mediaFileUrl: { type: String, trim: true },
    mediaType: { type: String, default: "image" },

    imageCaption: { type: String, trim: true },
    imageQuestionType: {
      type: String,
      default: "",
    },
    bitSize: {
      type: String,
      default: "",
    },
    bitRemovalDuration: {
      type: String,
      default: "",
    },
    optionA: { type: String, trim: true },
    optionB: { type: String, trim: true },
    optionC: { type: String, trim: true },
    selectedAnswer: { type: String, trim: true },
    audioFileName: { type: String, trim: true },
    audioFileUrl: { type: String, trim: true },
    additionalNotes: { type: String },
    bgColor: { type: String, default: "#ffffff" },
  },
  { _id: false }
);

const ImageQuizSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, trim: true },
    quizType: { type: String, default: "image", immutable: true },
    // ✅ FIX: Removed arrayLimit validator — it fires even with runValidators:false
    // in some Mongoose versions, causing false "exceeds 16 screens" errors.
    // The 16-screen limit is enforced in the controller instead.
    screens: {
      type: [ImageScreenSchema],
    },
  },
  {
    timestamps: true,
    collection: "imagequizzes",
  }
);

ImageQuizSchema.index({ quizName: 1 });
ImageQuizSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ImageQuiz", ImageQuizSchema);
