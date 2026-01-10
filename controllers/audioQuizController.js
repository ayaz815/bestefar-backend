const fs = require("fs");
const path = require("path");
const AudioQuiz = require("../models/AudioQuiz");
const Quiz = require("../models/Form"); // Old model for backward compatibility

const saveAudioQuizForm = async (req, res) => {
  const {
    page,
    quizName,
    question,
    answer,
    firmNaming,
    musicName,
    artistName,
    musicFileName,
    musicFileUrl,
    audioFileName,
    audioFileUrl,
    additionalNotes,
  } = req.body;

  console.log("📥 Received audio quiz form data:", req.body);

  if (!page || !quizName) {
    return res.status(400).json({
      error: "Page and quizName are required.",
    });
  }

  try {
    // ✅ Step 1: Update local JSON file
    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    console.log("📂 Resolved file path:", jsonFilePath);

    // Ensure folder and file exist
    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    if (!fs.existsSync(jsonFilePath)) {
      fs.writeFileSync(jsonFilePath, JSON.stringify({}, null, 2), "utf8");
    }

    // Read JSON file
    let jsonData = {};
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, {
        encoding: "utf8",
        flag: "r",
      });
      jsonData = JSON.parse(fileContent);
    }

    // Update screen data for audio quiz
    jsonData[`screen${page}`] = {
      quizName,
      quizType: "audio",
      question: question || "",
      answer: answer || "",
      firmNaming: firmNaming || "",
      musicName: musicName || "",
      artistName: artistName || "",
      musicFileName: musicFileName || "",
      musicFileUrl: musicFileUrl || "",
      audioFileName: audioFileName || "",
      audioFileUrl: audioFileUrl || "",
      additionalNotes: additionalNotes || "",
    };

    console.log(`✅ Audio quiz JSON updated for screen${page}`);

    // Write updated JSON back to file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    // ✅ Step 2: Save to MongoDB
    let audioQuiz = await AudioQuiz.findOne({ quizName });

    if (audioQuiz) {
      // Find if the screen already exists
      const screenIndex = audioQuiz.screens.findIndex(
        (s) => s.page === parseInt(page)
      );

      const screenData = {
        page: parseInt(page),
        question: question || "",
        answer: answer || "",
        firmNaming: firmNaming || "",
        musicName: musicName || "",
        artistName: artistName || "",
        musicFileName: musicFileName || "",
        musicFileUrl: musicFileUrl || "",
        audioFileName: audioFileName || "",
        audioFileUrl: audioFileUrl || "",
        additionalNotes: additionalNotes || "",
      };

      if (screenIndex !== -1) {
        // Update existing screen
        audioQuiz.screens[screenIndex] = screenData;
      } else {
        // Add new screen
        audioQuiz.screens.push(screenData);
      }

      audioQuiz.screens.sort((a, b) => a.page - b.page);
      await audioQuiz.save();

      console.log(`✅ Audio quiz "${quizName}" updated in MongoDB.`);
    } else {
      // Create new audio quiz
      audioQuiz = new AudioQuiz({
        quizName,
        quizType: "audio",
        screens: [
          {
            page: parseInt(page),
            question: question || "",
            answer: answer || "",
            firmNaming: firmNaming || "",
            musicName: musicName || "",
            artistName: artistName || "",
            musicFileName: musicFileName || "",
            musicFileUrl: musicFileUrl || "",
            audioFileName: audioFileName || "",
            audioFileUrl: audioFileUrl || "",
            additionalNotes: additionalNotes || "",
          },
        ],
      });

      await audioQuiz.save();
      console.log(`✅ New audio quiz "${quizName}" created in MongoDB.`);
    }

    res.status(200).json({
      success: true,
      message: "Audio quiz form saved successfully.",
      data: {
        id: audioQuiz._id,
        quizName: audioQuiz.quizName,
        quizType: "audio",
        screen: audioQuiz.screens.find((s) => s.page === parseInt(page)),
      },
    });
  } catch (error) {
    console.error("❌ Error saving audio quiz form:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save audio quiz form",
      details: error.message,
    });
  }
};

const getAllAudioQuizzes = async (req, res) => {
  try {
    // ✅ Fetch from both old (Quiz) and new (AudioQuiz) models
    const [oldQuizzes, newAudioQuizzes] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }),
      AudioQuiz.find().sort({ createdAt: -1 }),
    ]);

    // Transform old quizzes to match new format
    const oldShows = oldQuizzes.map((quiz) => ({
      id: quiz._id.toString(),
      quizName: quiz.quizName,
      quizType: "audio",
      quizForms: quiz.screens || [],
      numberOfScreens: quiz.screens?.length || 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      source: "old", // Flag to identify source
    }));

    // Transform new audio quizzes
    const newShows = newAudioQuizzes.map((quiz) => ({
      id: quiz._id.toString(),
      quizName: quiz.quizName,
      quizType: "audio",
      quizForms: quiz.screens || [],
      numberOfScreens: quiz.screens?.length || 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      source: "new", // Flag to identify source
    }));

    // Combine and sort by creation date (newest first)
    const allShows = [...oldShows, ...newShows].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(
      `✅ Fetched ${allShows.length} audio quizzes (${oldShows.length} old + ${newShows.length} new)`
    );
    return res.status(200).json({ shows: allShows });
  } catch (err) {
    console.error("❌ Error fetching audio quizzes:", err);
    return res.status(500).json({ error: "Failed to fetch audio quizzes" });
  }
};

const getAudioQuizById = async (req, res) => {
  try {
    // ✅ Try to find in new AudioQuiz model first
    let audioQuiz = await AudioQuiz.findById(req.params.id);
    let source = "new";

    // ✅ If not found, try old Quiz model
    if (!audioQuiz) {
      audioQuiz = await Quiz.findById(req.params.id);
      source = "old";
    }

    if (!audioQuiz) {
      return res.status(404).json({ error: "Audio quiz not found" });
    }

    const quizForms = [];
    (audioQuiz.screens || []).forEach((screen) => {
      if (screen && typeof screen === "object") {
        quizForms.push(screen);
      }
    });

    console.log(`✅ Found audio quiz in ${source} model:`, audioQuiz.quizName);

    return res.status(200).json({
      id: audioQuiz._id.toString(),
      quizName: audioQuiz.quizName,
      quizType: "audio",
      quizForms,
      source, // Include source for debugging
    });
  } catch (err) {
    console.error("❌ Error fetching audio quiz:", err);
    return res.status(500).json({ error: "Failed to fetch audio quiz" });
  }
};

const updateAudioQuiz = async (req, res) => {
  try {
    const showId = req.params.id;
    console.log("Updating audio quiz with ID:", showId);
    const { quizName, quizForms } = req.body;

    if (!quizName || !Array.isArray(quizForms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    // ✅ Try to update in new AudioQuiz model first
    let updatedAudioQuiz = await AudioQuiz.findByIdAndUpdate(
      showId,
      {
        quizName,
        screens: quizForms,
      },
      { new: true }
    );

    let source = "new";

    // ✅ If not found in new model, try old Quiz model
    if (!updatedAudioQuiz) {
      updatedAudioQuiz = await Quiz.findByIdAndUpdate(
        showId,
        {
          quizName,
          screens: quizForms,
        },
        { new: true }
      );
      source = "old";
    }

    if (!updatedAudioQuiz) {
      return res
        .status(404)
        .json({ success: false, message: "Audio quiz not found" });
    }

    console.log(`✅ Updated audio quiz in ${source} model`);

    return res.status(200).json({
      success: true,
      message: "Audio quiz updated successfully.",
      data: {
        id: updatedAudioQuiz._id,
        quizName: updatedAudioQuiz.quizName,
        quizType: "audio",
        quizForms: updatedAudioQuiz.screens,
      },
    });
  } catch (err) {
    console.error("Error in updateAudioQuiz:", err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

const deleteAudioQuiz = async (req, res) => {
  try {
    // ✅ Try to delete from new AudioQuiz model first
    let result = await AudioQuiz.findByIdAndDelete(req.params.id);
    let source = "new";

    // ✅ If not found, try old Quiz model
    if (!result) {
      result = await Quiz.findByIdAndDelete(req.params.id);
      source = "old";
    }

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Audio quiz not found" });
    }

    console.log(`✅ Deleted audio quiz from ${source} model`);

    res.json({
      success: true,
      message: "Audio quiz deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error deleting audio quiz:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete audio quiz" });
  }
};

module.exports = {
  saveAudioQuizForm,
  getAllAudioQuizzes,
  getAudioQuizById,
  updateAudioQuiz,
  deleteAudioQuiz,
};
