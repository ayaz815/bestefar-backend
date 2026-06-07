// controllers/imageMusicController.js
const ImageMusic = require("../models/ImageMusic");

const escRe = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

// POST /api/image-music/save-image-music-form
const saveImageMusicForm = async (req, res) => {
  const {
    showId,
    page,
    quizName,
    aboutShow,
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
  } = req.body;

  if (!page) return res.status(400).json({ error: "Page is required." });
  if (!quizName?.toString().trim())
    return res.status(400).json({ error: "Show name is required." });

  const pageNumber = parseInt(page, 10);
  const totalPageNum = parseInt(totalPages, 10) || 16;

  const {
    perSlideMp3Url = "",
    perSlideMp3FileName = "",
    imMusicMode = "shared",
  } = req.body;

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
    imMusicMode: imMusicMode || "shared",
  };

  try {
    const existing = showId?.trim()
      ? await ImageMusic.findById(showId).lean()
      : null;

    if (existing) {
      // Name conflict check
      const conflict = await ImageMusic.findOne({
        _id: { $ne: existing._id },
        quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
      });
      if (conflict) {
        return res.status(409).json({
          error: `A show named "${quizName}" already exists.`,
          existingId: conflict._id,
        });
      }

      // Merge screen
      const screens = existing.screens.map((s) =>
        s.page === pageNumber ? { ...s, ...screenData } : s
      );
      if (!existing.screens.some((s) => s.page === pageNumber)) {
        screens.push(screenData);
        screens.sort((a, b) => a.page - b.page);
      }

      const updated = await ImageMusic.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            quizName,
            aboutShow: aboutShow || existing.aboutShow || "",
            sharedMp3Url: sharedMp3Url || existing.sharedMp3Url || "",
            sharedMp3FileName:
              sharedMp3FileName || existing.sharedMp3FileName || "",
            totalPages: totalPageNum,
            imMusicMode: imMusicMode || existing.imMusicMode || "shared",
            screens,
          },
        },
        { new: true, runValidators: false }
      );

      return res.status(200).json({
        success: true,
        message: `ImageMusic form saved for page ${page}`,
        data: {
          id: updated._id,
          quizName: updated.quizName,
          quizType: "imagemusic",
          screen: screenData,
        },
      });
    }

    // New show
    const duplicate = await ImageMusic.findOne({
      quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
    });
    if (duplicate) {
      return res.status(409).json({
        error: `A show named "${quizName}" already exists.`,
        existingId: duplicate._id,
      });
    }

    const created = await ImageMusic.create({
      quizName,
      quizType: "imagemusic",
      aboutShow: aboutShow || "",
      sharedMp3Url: sharedMp3Url || "",
      sharedMp3FileName: sharedMp3FileName || "",
      totalPages: totalPageNum,
      imMusicMode: imMusicMode || "shared",
      screens: [screenData],
    });

    return res.status(200).json({
      success: true,
      message: `ImageMusic form saved for page ${page}`,
      data: {
        id: created._id,
        quizName: created.quizName,
        quizType: "imagemusic",
        screen: screenData,
      },
    });
  } catch (err) {
    console.error("❌ saveImageMusicForm error:", err);
    return res
      .status(500)
      .json({ error: "Failed to save ImageMusic form.", details: err.message });
  }
};

// GET /api/image-music/get-all-image-music-shows
const getAllImageMusicShows = async (req, res) => {
  try {
    const shows = await ImageMusic.find().sort({ createdAt: -1 });
    const result = shows.map((show) => ({
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
    }));
    return res.status(200).json({ shows: result });
  } catch (err) {
    console.error("❌ getAllImageMusicShows error:", err);
    return res.status(500).json({ error: "Failed to fetch ImageMusic shows." });
  }
};

// GET /api/image-music/get-image-music-show/:id
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
    console.error("❌ getImageMusicShowById error:", err);
    return res.status(500).json({ error: "Failed to fetch ImageMusic show." });
  }
};

// PUT /api/image-music/update-image-music-show/:id
const updateImageMusicShow = async (req, res) => {
  try {
    const {
      quizName,
      screens,
      aboutShow,
      sharedMp3Url,
      sharedMp3FileName,
      totalPages,
    } = req.body;

    if (!quizName)
      return res
        .status(400)
        .json({ success: false, message: "quizName required." });

    const conflict = await ImageMusic.findOne({
      _id: { $ne: req.params.id },
      quizName: { $regex: new RegExp(`^${escRe(quizName)}$`, "i") },
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `A show named "${quizName}" already exists.`,
        existingId: conflict._id,
      });
    }

    const updated = await ImageMusic.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          quizName,
          aboutShow: aboutShow || "",
          sharedMp3Url: sharedMp3Url || "",
          sharedMp3FileName: sharedMp3FileName || "",
          totalPages: parseInt(totalPages, 10) || 16,
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
      message: "ImageMusic show updated successfully.",
      data: {
        id: updated._id,
        quizName: updated.quizName,
        quizType: "imagemusic",
      },
    });
  } catch (err) {
    console.error("❌ updateImageMusicShow error:", err);
    return res.status(500).json({ success: false, message: "Update failed." });
  }
};

// DELETE /api/image-music/delete-image-music-show/:id
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
    console.error("❌ deleteImageMusicShow error:", err);
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
