// controllers/imageMusicController.js
const ImageMusic = require("../models/ImagrMusicQuiz");

const escRe = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// aboutShow is a show-level field — NOT per screen
const screenToClient = (s) => ({
  page: s.page,
  mediaFileName: s.mediaFileName || "",
  mediaFileUrl: s.mediaFileUrl || "",
  mediaType: s.mediaType || "image",
  bgColor: s.bgColor || "#000000",
  melodyName: s.melodyName || "",
  aboutMelody: s.aboutMelody || "",
  displaySeconds: s.displaySeconds || 8,
  screenText: s.screenText || "",
  additionalNotes: s.additionalNotes || "",
  perSlideMp3Url: s.perSlideMp3Url || "",
  perSlideMp3FileName: s.perSlideMp3FileName || "",
  imMusicMode: s.imMusicMode || "shared",
  quizType: "imagemusic",
});

// ── POST /api/image-music/save-image-music-form ───────────────────────────────
const saveImageMusicForm = async (req, res) => {
  const {
    showId,
    page,
    quizName,
    sharedMp3Url,
    sharedMp3FileName,
    totalPages,
    melodyName,
    aboutMelody,
    displaySeconds,
    screenText,
    mediaFileName,
    mediaFileUrl,
    mediaType,
    bgColor,
    additionalNotes,
    perSlideMp3Url = "",
    perSlideMp3FileName = "",
  } = req.body;

  if (!page) return res.status(400).json({ error: "Page is required." });
  if (!quizName?.toString().trim())
    return res.status(400).json({ error: "Show name is required." });

  const pageNumber = parseInt(page, 10);
  const totalPageNum = parseInt(totalPages, 10) || 16;
  const imMusicMode = req.body.imMusicMode || null;

  // aboutShow is show-level — only update when page 1 sends it
  const aboutShowSent = Object.prototype.hasOwnProperty.call(
    req.body,
    "aboutShow"
  );
  const incomingAboutShow = req.body.aboutShow || "";

  try {
    const existing = showId?.trim()
      ? await ImageMusic.findById(showId).lean()
      : null;
    const resolvedMode = imMusicMode || existing?.imMusicMode || "shared";

    if (existing) {
      // Name conflict check (exclude self)
      const conflict = await ImageMusic.findOne({
        _id: { $ne: existing._id },
        quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
      });
      if (conflict)
        return res.status(409).json({
          error: `A show named "${quizName}" already exists.`,
          existingId: conflict._id,
        });

      const existingScreen =
        existing.screens.find((s) => s.page === pageNumber) || {};

      const screenData = {
        page: pageNumber,
        mediaFileName: mediaFileName || existingScreen.mediaFileName || "",
        mediaFileUrl: mediaFileUrl || existingScreen.mediaFileUrl || "",
        mediaType: mediaType || existingScreen.mediaType || "image",
        bgColor: bgColor || existingScreen.bgColor || "#000000",
        melodyName: melodyName || existingScreen.melodyName || "",
        aboutMelody: aboutMelody || existingScreen.aboutMelody || "",
        displaySeconds:
          Number(displaySeconds) || existingScreen.displaySeconds || 8,
        screenText: screenText || existingScreen.screenText || "",
        additionalNotes:
          additionalNotes || existingScreen.additionalNotes || "",
        perSlideMp3Url: perSlideMp3Url || existingScreen.perSlideMp3Url || "",
        perSlideMp3FileName:
          perSlideMp3FileName || existingScreen.perSlideMp3FileName || "",
        imMusicMode: resolvedMode,
      };

      // FIX: use `let` so we can reassign after filter
      let screens = existing.screens.map((s) =>
        s.page === pageNumber ? { ...s, ...screenData } : s
      );
      if (!existing.screens.some((s) => s.page === pageNumber)) {
        screens.push(screenData);
        screens.sort((a, b) => a.page - b.page);
        screens = screens.filter((s) => s.page <= totalPageNum); // ← was crashing: const reassignment
      }

      // aboutShow: only update at show level when page 1 sends it
      const showLevelAboutShow = aboutShowSent
        ? incomingAboutShow || existing.aboutShow || ""
        : existing.aboutShow || "";

      const updated = await ImageMusic.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            quizName,
            aboutShow: showLevelAboutShow,
            sharedMp3Url: sharedMp3Url || existing.sharedMp3Url || "",
            sharedMp3FileName:
              sharedMp3FileName || existing.sharedMp3FileName || "",
            totalPages: totalPageNum,
            imMusicMode: resolvedMode,
            screens,
          },
        },
        { new: true, runValidators: false }
      );

      return res.status(200).json({
        success: true,
        data: {
          id: updated._id,
          quizName: updated.quizName,
          quizType: "imagemusic",
          imMusicMode: updated.imMusicMode,
          screen: screenData,
        },
      });
    }

    // ── New show ──────────────────────────────────────────────────────────────
    const duplicate = await ImageMusic.findOne({
      quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
    });
    if (duplicate)
      return res.status(409).json({
        error: `A show named "${quizName}" already exists.`,
        existingId: duplicate._id,
      });

    const screenData = {
      page: pageNumber,
      mediaFileName: mediaFileName || "",
      mediaFileUrl: mediaFileUrl || "",
      mediaType: mediaType || "image",
      bgColor: bgColor || "#000000",
      melodyName: melodyName || "",
      aboutMelody: aboutMelody || "",
      displaySeconds: Number(displaySeconds) || 8,
      screenText: screenText || "",
      additionalNotes: additionalNotes || "",
      perSlideMp3Url: perSlideMp3Url || "",
      perSlideMp3FileName: perSlideMp3FileName || "",
      imMusicMode: resolvedMode,
    };

    const created = await ImageMusic.create({
      quizName,
      quizType: "imagemusic",
      aboutShow: incomingAboutShow || "",
      sharedMp3Url: sharedMp3Url || "",
      sharedMp3FileName: sharedMp3FileName || "",
      totalPages: totalPageNum,
      imMusicMode: resolvedMode,
      screens: [screenData],
    });

    return res.status(200).json({
      success: true,
      data: {
        id: created._id,
        quizName: created.quizName,
        quizType: "imagemusic",
        imMusicMode: created.imMusicMode,
        screen: screenData,
      },
    });
  } catch (err) {
    console.error("❌ saveImageMusicForm:", err);
    return res
      .status(500)
      .json({ error: "Failed to save ImageMusic form.", details: err.message });
  }
};

// ── GET /api/image-music/get-all-image-music-shows ────────────────────────────
const getAllImageMusicShows = async (req, res) => {
  try {
    const shows = await ImageMusic.find().sort({ createdAt: -1 });
    return res.status(200).json({
      shows: shows.map((show) => ({
        id: show._id.toString(),
        quizName: show.quizName,
        quizType: "imagemusic",
        aboutShow: show.aboutShow || "",
        sharedMp3Url: show.sharedMp3Url || "",
        sharedMp3FileName: show.sharedMp3FileName || "",
        totalPages: show.totalPages || 16,
        imMusicMode: show.imMusicMode || "shared",
        numberOfScreens: show.screens?.length || 0,
        screens: (show.screens || []).map(screenToClient),
        createdAt: show.createdAt,
        updatedAt: show.updatedAt,
      })),
    });
  } catch (err) {
    console.error("❌ getAllImageMusicShows:", err);
    return res.status(500).json({ error: "Failed to fetch ImageMusic shows." });
  }
};

// ── GET /api/image-music/get-image-music-show/:id ─────────────────────────────
const getImageMusicShowById = async (req, res) => {
  try {
    const show = await ImageMusic.findById(req.params.id);
    if (!show) return res.status(404).json({ error: "Show not found." });

    return res.status(200).json({
      id: show._id.toString(),
      quizName: show.quizName,
      quizType: "imagemusic",
      aboutShow: show.aboutShow || "",
      sharedMp3Url: show.sharedMp3Url || "",
      sharedMp3FileName: show.sharedMp3FileName || "",
      totalPages: show.totalPages || 16,
      imMusicMode: show.imMusicMode || "shared",
      screens: (show.screens || []).map(screenToClient),
    });
  } catch (err) {
    console.error("❌ getImageMusicShowById:", err);
    return res.status(500).json({ error: "Failed to fetch ImageMusic show." });
  }
};

// ── PUT /api/image-music/update-image-music-show/:id ──────────────────────────
const updateImageMusicShow = async (req, res) => {
  try {
    const {
      quizName,
      screens,
      sharedMp3Url,
      sharedMp3FileName,
      totalPages,
      imMusicMode,
      aboutShow,
    } = req.body;

    if (!quizName)
      return res
        .status(400)
        .json({ success: false, message: "quizName required." });

    const conflict = await ImageMusic.findOne({
      _id: { $ne: req.params.id },
      quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
    });
    if (conflict)
      return res.status(409).json({
        success: false,
        message: `A show named "${quizName}" already exists.`,
        existingId: conflict._id,
      });

    const existing = await ImageMusic.findById(req.params.id).lean();
    const resolvedMode = imMusicMode || existing?.imMusicMode || "shared";

    const updated = await ImageMusic.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          quizName,
          aboutShow:
            aboutShow !== undefined ? aboutShow : existing?.aboutShow || "",
          sharedMp3Url: sharedMp3Url || "",
          sharedMp3FileName: sharedMp3FileName || "",
          totalPages: parseInt(totalPages, 10) || 16,
          imMusicMode: resolvedMode,
          ...(Array.isArray(screens) && {
            screens: screens.filter((s) => s?.page != null),
          }),
        },
      },
      { new: true, runValidators: false }
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Show not found." });

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id,
        quizName: updated.quizName,
        quizType: "imagemusic",
        imMusicMode: updated.imMusicMode,
      },
    });
  } catch (err) {
    console.error("❌ updateImageMusicShow:", err);
    return res.status(500).json({ success: false, message: "Update failed." });
  }
};

// ── DELETE /api/image-music/delete-image-music-show/:id ───────────────────────
const deleteImageMusicShow = async (req, res) => {
  try {
    const result = await ImageMusic.findByIdAndDelete(req.params.id);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Show not found." });
    return res.status(200).json({
      success: true,
      message: "ImageMusic show deleted.",
      data: result,
    });
  } catch (err) {
    console.error("❌ deleteImageMusicShow:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete show." });
  }
};

module.exports = {
  saveImageMusicForm,
  getAllImageMusicShows,
  getImageMusicShowById,
  updateImageMusicShow,
  deleteImageMusicShow,
};
