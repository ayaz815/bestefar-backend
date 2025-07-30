const fs = require("fs");
const path = require("path");

const Quiz = require("../models/Form");

const saveForm = async (req, res) => {
  const {
    page,
    quizName,
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
    const quiz = await Quiz.findOneAndUpdate(
      { quizName },
      {
        $set: {
          [`screens.${page - 1}`]: screenData,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

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
        // quizForms,
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
