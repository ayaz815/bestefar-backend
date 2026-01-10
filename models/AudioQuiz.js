const mongoose = require("mongoose");

const AudioScreenSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 1, max: 16 },

    // Common fields
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
    additionalNotes: { type: String }, // HTML or plain text

    // Audio quiz specific fields
    firmNaming: { type: String, trim: true }, // Music, Saying, Sound
    musicName: { type: String, trim: true },
    artistName: { type: String, trim: true },
    musicFileName: { type: String, trim: true },
    musicFileUrl: { type: String, trim: true },
    audioFileName: { type: String, trim: true },
    audioFileUrl: { type: String, trim: true },
  },
  { _id: false }
);

const AudioQuizSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, trim: true },
    quizType: { type: String, default: "audio", immutable: true },

    screens: {
      type: [AudioScreenSchema],
      validate: [arrayLimit, "{PATH} exceeds the limit of 16 screens"],
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "audioquizzes", // explicit collection name
  }
);

// Validation to enforce max 16 screens
function arrayLimit(val) {
  return val.length <= 16;
}

// Add indexes
AudioQuizSchema.index({ quizName: 1 });
AudioQuizSchema.index({ createdAt: -1 });

// Pre-update hook
AudioQuizSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model("AudioQuiz", AudioQuizSchema);
