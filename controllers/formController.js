const fs = require("fs");
const path = require("path");

const Quiz = require("../models/Form");

const saveForm = async (req, res) => {
  const {
    page,
    quizName,
    quizInfo,
    quizMusician,
    question,
    answer,
    firmNaming,
    musicName,
    artistName,
    additionalNotes,
    musicFileName,
    audioFileName,
    musicFileUrl,
    audioFileUrl,
  } = req.body;

  if (!page || !question || !answer || !firmNaming || !quizName) {
    return res.status(400).json({
      error: "Page, question, answer, firmNaming, and quizName are required.",
    });
  }

  try {
    // ✅ Step 1: Update local JSON file
    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    // const jsonFilePath = "../../html/data/content/content.json";
    console.log("Resolved file path:", jsonFilePath);

    // Ensure folder and file exist
    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    if (!fs.existsSync(jsonFilePath)) {
      fs.writeFileSync(jsonFilePath, JSON.stringify({}, null, 2), "utf8");
    }

    // Force fresh read of JSON file (avoid caching)
    let jsonData = {};
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = await fs.readFileSync(jsonFilePath, {
        encoding: "utf8",
        flag: "r",
      }); // Open file fresh each time
      jsonData = JSON.parse(fileContent);
    }

    jsonData[`screen${page}`] = {
      ...(jsonData[`screen${page}`] || {}),
      quizName,
      question,
      answer,
      firmNaming,
      musicName,
      artistName,
      additionalNotes,
      musicFileName: req.body.musicFileName || "",
      audioFileName: req.body.audioFileName || "",
      musicFileUrl: req.body.musicFileUrl || "",
      audioFileUrl: req.body.audioFileUrl || "",
    };

    // Write updated JSON back to the file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`✅ JSON file updated successfully for screen${page}`);

    const screenData = {
      page,
      question,
      answer,
      firmNaming,
      musicName,
      artistName,
      musicFileName: req.body.musicFileName || "",
      audioFileName: req.body.audioFileName || "",
      musicFileUrl: req.body.musicFileUrl || "",
      audioFileUrl: req.body.audioFileUrl || "",
      additionalNotes,
    };

    // ✅ Step 2: Upsert into MongoDB
    // quizInfo/quizMusician are quiz-level (shown once on bestefar.no's
    // catalog, not per-screen), so they're only ever set from page 1's
    // save - the field is disabled on every other page in the UI anyway.
    //
    // IMPORTANT: don't $set a dot-path like `screens.${page-1}` directly in
    // an upsert - if `screens` doesn't already exist as a real array on the
    // document (e.g. this is the first page ever saved for a brand new
    // quiz), MongoDB creates `screens` as a plain OBJECT with numeric
    // string keys ("0", "1", ...) instead of a true array. `screens.length`
    // then reads as 1 forever after, even with all 16 pages filled in -
    // this is exactly what broke the "Ant spørsmål" count on the catalog.
    // Read-modify-write with a real JS array avoids that ambiguity.
    let quiz = await Quiz.findOne({ quizName });
    if (!quiz) {
      quiz = new Quiz({ quizName, screens: [], isPublic: false });
    }
    const screensArr = Array.isArray(quiz.screens) ? [...quiz.screens] : [];
    screensArr[page - 1] = screenData;
    quiz.screens = screensArr;
    if (Number(page) === 1) {
      quiz.quizInfo = quizInfo || "";
      quiz.quizMusician = quizMusician || "";
    }
    await quiz.save();

    console.log(`✅ MongoDB quiz updated for page ${page}`);

    return res.status(200).json({
      success: true,
      message: `Form saved successfully for page ${page}`,
      data: quiz,
    });
  } catch (error) {
    console.error("❌ Error saving form:", error);
    res.status(500).json({ error: "Failed to save form and update JSON." });
  }
};

const getAllShows = async (req, res) => {
  try {
    const quizzes = await Quiz.find({});
    const shows = quizzes.map((quiz) => {
      const quizForms = [];

      (quiz.screens || []).forEach((screen) => {
        if (screen && typeof screen === "object") {
          quizForms.push(screen);
        }
      });

      return {
        id: quiz._id.toString(),
        quizName: quiz.quizName,
        quizInfo: quiz.quizInfo || "",
        quizMusician: quiz.quizMusician || "",
        isPublic: quiz.isPublic !== false,
        quizForms,
      };
    });

    return res.status(200).json({ shows });
  } catch (err) {
    console.error("❌ Error fetching shows:", err);
    return res.status(500).json({ error: "Failed to fetch shows" });
  }
};

// Add to your formController.js
const getShowById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Show not found" });
    }

    const quizForms = [];
    (quiz.screens || []).forEach((screen) => {
      if (screen && typeof screen === "object") {
        quizForms.push(screen);
      }
    });

    return res.status(200).json({
      id: quiz._id.toString(),
      quizName: quiz.quizName,
      quizInfo: quiz.quizInfo || "",
      quizMusician: quiz.quizMusician || "",
      quizForms,
    });
  } catch (err) {
    console.error("❌ Error fetching show:", err);
    return res.status(500).json({ error: "Failed to fetch show" });
  }
};

const updateShow = async (req, res) => {
  try {
    const showId = req.params.id;
    console.log("Updating show with ID:", showId);
    const { quizName, quizForms } = req.body;

    if (!quizName || !Array.isArray(quizForms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const updatedShow = await Quiz.findByIdAndUpdate(
      showId,
      {
        quizName,
        quizForms,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Show updated successfully.",
      data: {
        id: updatedShow._id,
        quizName: updatedShow.quizName,
        quizForms: updatedShow.screens,
      },
    });
  } catch (err) {
    console.error("Error in updateShow:", err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

const deleteShow = async (req, res) => {
  try {
    const result = await Quiz.findByIdAndDelete(req.params.id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Show not found" });
    }
    res.json({
      success: true,
      message: "Show deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error deleting show:", error);
    res.status(500).json({ success: false, message: "Failed to delete show" });
  }
};

module.exports = { saveForm, getAllShows, getShowById, updateShow, deleteShow };
