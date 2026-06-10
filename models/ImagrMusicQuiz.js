// models/ImageMusic.js
const mongoose = require("mongoose");

const ImageMusicScreenSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 1 },
    mediaFileName: { type: String, trim: true, default: "" },
    mediaFileUrl: { type: String, trim: true, default: "" },
    mediaType: { type: String, default: "image" },
    bgColor: { type: String, default: "#000000" },
    melodyName: { type: String, trim: true, default: "" },
    aboutMelody: { type: String, default: "" },
    // per-page "About the show" text (each slide has its own)
    aboutShow: { type: String, default: "" },
    displaySeconds: { type: Number, default: 8 },
    screenText: { type: String, trim: true, default: "" },
    additionalNotes: { type: String, default: "" },
    perSlideMp3Url: { type: String, default: "" },
    perSlideMp3FileName: { type: String, default: "" },
    imMusicMode: { type: String, default: "shared" },
  },
  { _id: false }
);

const ImageMusicSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, trim: true },
    quizType: { type: String, default: "imagemusic", immutable: true },
    // show-level aboutShow kept for backward compat with existing data
    aboutShow: { type: String, default: "" },
    sharedMp3Url: { type: String, default: "" },
    sharedMp3FileName: { type: String, default: "" },
    totalPages: { type: Number, default: 16, min: 16, max: 32 },
    imMusicMode: { type: String, default: "shared" },
    screens: { type: [ImageMusicScreenSchema], default: [] },
  },
  { timestamps: true, collection: "imagemusicshows" }
);

ImageMusicSchema.index({ quizName: 1 });
ImageMusicSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ImageMusic", ImageMusicSchema);
