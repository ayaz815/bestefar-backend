const fs = require("fs");
const path = require("path");
const ImageQuiz = require("../models/ImageQuiz");

const saveImageQuizForm = async (req, res) => {
  const {
    page,
    quizName,
    question,
    answer,
    mediaFileName,
    mediaFileUrl,
    mediaType,
    imageCaption,
    imageQuestionType,
    bitSize,
    bitRemovalDuration,
    selectedAnswer,
    audioFileName,
    audioFileUrl,
    additionalNotes,
  } = req.body;

  if (!page || !quizName) {
    return res.status(400).json({
      error: "Page and quizName are required.",
    });
  }

  try {
    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html2/data/content/content.json";

    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    // ✅ Determine array name based on imageQuestionType
    let arrayName;
    if (imageQuestionType === "bit-by-bit") {
      arrayName = "bit";
    } else if (imageQuestionType === "single-question") {
      arrayName = "single";
    } else if (imageQuestionType === "multiple-questions") {
      arrayName = "multiple";
    } else {
      arrayName = "single"; // default fallback
    }

    // ✅ Start with fresh object containing only the current type
    let jsonData = {};

    // If file exists and has the SAME array type, load it
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, "utf8");
      const existingData = JSON.parse(fileContent);

      // Only keep existing data if it's the same array type
      if (existingData[arrayName]) {
        jsonData[arrayName] = existingData[arrayName];
      }
    }

    // ✅ Initialize the appropriate array
    if (!jsonData[arrayName]) {
      jsonData[arrayName] = [];
    }

    // Ensure array has 16 slots with minimal structure based on quiz type
    while (jsonData[arrayName].length < 16) {
      if (arrayName === "bit") {
        // Bit-by-bit includes answer field
        jsonData[arrayName].push({
          question: "",
          media: "",
          audio: "",
          answer: "",
        });
      } else if (arrayName === "single") {
        // Single question does NOT include answer in JSON
        jsonData[arrayName].push({
          question: "",
          media: "",
          audio: "",
        });
      } else if (arrayName === "multiple") {
        // Multiple questions includes choices array
        jsonData[arrayName].push({
          question: "",
          media: "",
          audio: "",
          choices: [],
        });
      }
    }

    const pageNumber = parseInt(page);

    // ✅ Check if quiz already exists and get existing screen data FIRST
    let existingImageQuiz = await ImageQuiz.findOne({ quizName });
    let existingScreen = null;

    if (existingImageQuiz) {
      existingScreen = existingImageQuiz.screens.find(
        (s) => s.page === pageNumber
      );
    }

    // ✅ Update ONLY the fields needed for HTML quiz (minimal structure)
    let pageData = {};

    // Use unified media URL
    const mediaUrl = mediaFileUrl || existingScreen?.mediaFileUrl || "";

    if (arrayName === "bit") {
      // Bit-by-bit: question, media, audio, answer
      pageData = {
        question: question || "",
        media: mediaUrl,
        audio: audioFileUrl || existingScreen?.audioFileUrl || "",
        answer: answer || "",
      };
    } else if (arrayName === "single") {
      // Single question: question, media, audio (NO answer in JSON)
      pageData = {
        question: question || "",
        media: mediaUrl,
        audio: audioFileUrl || existingScreen?.audioFileUrl || "",
      };
    } else if (arrayName === "multiple") {
      // Multiple questions: question, media, audio, choices
      pageData = {
        question: question || "",
        media: mediaUrl,
        audio: audioFileUrl || existingScreen?.audioFileUrl || "",
        choices: selectedAnswer
          ? selectedAnswer.split(",").map((c) => c.trim())
          : [],
      };
    }

    jsonData[arrayName][page - 1] = pageData;

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(
      `✅ Image quiz JSON updated for ${arrayName}[${page - 1}]:`,
      JSON.stringify(pageData, null, 2)
    );

    // ✅ Now build screenData for MongoDB (existingScreen already fetched above)
    const screenData = {
      page: pageNumber,
      question: question || "",
      answer: answer || "",
      mediaFileName: mediaFileName || existingScreen?.mediaFileName || "",
      mediaFileUrl: mediaFileUrl || existingScreen?.mediaFileUrl || "",
      mediaType: mediaType || existingScreen?.mediaType || "image",
      imageCaption: imageCaption || existingScreen?.imageCaption || "",
      imageQuestionType: imageQuestionType || "single-question",
      bitSize: bitSize || "1",
      bitRemovalDuration:
        bitRemovalDuration || existingScreen?.bitRemovalDuration || "3",
      selectedAnswer: selectedAnswer || existingScreen?.selectedAnswer || "",
      audioFileName: audioFileName || existingScreen?.audioFileName || "",
      audioFileUrl: audioFileUrl || existingScreen?.audioFileUrl || "",
      additionalNotes: additionalNotes || existingScreen?.additionalNotes || "",
    };

    console.log("💾 Screen data to save:", JSON.stringify(screenData, null, 2));
    console.log(
      "🔍 Existing screen data:",
      JSON.stringify(existingScreen, null, 2)
    );

    let imageQuiz = existingImageQuiz;

    if (imageQuiz) {
      const screenIndex = imageQuiz.screens.findIndex(
        (s) => s.page === pageNumber
      );

      if (screenIndex !== -1) {
        Object.assign(imageQuiz.screens[screenIndex], screenData);
        imageQuiz.markModified("screens");
      } else {
        imageQuiz.screens.push(screenData);
      }

      imageQuiz.screens.sort((a, b) => a.page - b.page);
      await imageQuiz.save();
    } else {
      imageQuiz = new ImageQuiz({
        quizName,
        quizType: "image",
        screens: [screenData],
      });
      await imageQuiz.save();
    }

    return res.status(200).json({
      success: true,
      message: `Image quiz form saved successfully for page ${page}`,
      data: {
        id: imageQuiz._id,
        quizName: imageQuiz.quizName,
        quizType: "image",
        screen: screenData,
      },
    });
  } catch (error) {
    console.error("❌ Error saving image quiz form:", error);
    res.status(500).json({
      error: "Failed to save image quiz form.",
      details: error.message,
    });
  }
};

const getAllImageQuizzes = async (req, res) => {
  try {
    const imageQuizzes = await ImageQuiz.find().sort({ createdAt: -1 });

    console.log(
      "📊 Sample screen from DB:",
      JSON.stringify(imageQuizzes[0]?.screens[0], null, 2)
    );

    const shows = imageQuizzes.map((quiz) => ({
      id: quiz._id.toString(),
      quizName: quiz.quizName,
      quizType: "image",
      quizForms: (quiz.screens || []).map((screen) => ({
        page: screen.page,
        question: screen.question || "",
        answer: screen.answer || "",
        mediaFileName: screen.mediaFileName || "",
        mediaFileUrl: screen.mediaFileUrl || "",
        mediaType: screen.mediaType || "image",
        imageCaption: screen.imageCaption || "",
        imageQuestionType: screen.imageQuestionType || "single-question",
        bitSize: screen.bitSize || "1",
        bitRemovalDuration: screen.bitRemovalDuration || "3",
        selectedAnswer: screen.selectedAnswer || "",
        audioFileName: screen.audioFileName || "",
        audioFileUrl: screen.audioFileUrl || "",
        additionalNotes: screen.additionalNotes || "",
        quizType: "image",
      })),
      numberOfScreens: quiz.screens?.length || 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    }));

    console.log(`✅ Fetched ${shows.length} image quizzes`);
    return res.status(200).json({ shows });
  } catch (err) {
    console.error("❌ Error fetching image quizzes:", err);
    return res.status(500).json({ error: "Failed to fetch image quizzes" });
  }
};

const getImageQuizById = async (req, res) => {
  try {
    const imageQuiz = await ImageQuiz.findById(req.params.id);
    if (!imageQuiz) {
      return res.status(404).json({ error: "Image quiz not found" });
    }

    console.log(
      "📊 Quiz by ID from DB:",
      JSON.stringify(imageQuiz.screens[0], null, 2)
    );

    const quizForms = (imageQuiz.screens || []).map((screen) => ({
      page: screen.page,
      question: screen.question || "",
      answer: screen.answer || "",
      mediaFileName: screen.mediaFileName || "",
      mediaFileUrl: screen.mediaFileUrl || "",
      mediaType: screen.mediaType || "image",
      imageCaption: screen.imageCaption || "",
      imageQuestionType: screen.imageQuestionType || "single-question",
      bitSize: screen.bitSize || "1",
      bitRemovalDuration: screen.bitRemovalDuration || "3",
      selectedAnswer: screen.selectedAnswer || "",
      audioFileName: screen.audioFileName || "",
      audioFileUrl: screen.audioFileUrl || "",
      additionalNotes: screen.additionalNotes || "",
      quizType: "image",
    }));

    console.log(`✅ Fetched quiz by ID with ${quizForms.length} screens`);
    return res.status(200).json({
      id: imageQuiz._id.toString(),
      quizName: imageQuiz.quizName,
      quizType: "image",
      screens: quizForms,
    });
  } catch (err) {
    console.error("❌ Error fetching image quiz:", err);
    return res.status(500).json({ error: "Failed to fetch image quiz" });
  }
};

const updateImageQuiz = async (req, res) => {
  try {
    const showId = req.params.id;
    console.log("Updating image quiz with ID:", showId);
    const { quizName, quizForms } = req.body;

    if (!quizName || !Array.isArray(quizForms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const updatedImageQuiz = await ImageQuiz.findByIdAndUpdate(
      showId,
      {
        quizName,
        screens: quizForms,
      },
      { new: true }
    );

    if (!updatedImageQuiz) {
      return res
        .status(404)
        .json({ success: false, message: "Image quiz not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Image quiz updated successfully.",
      data: {
        id: updatedImageQuiz._id,
        quizName: updatedImageQuiz.quizName,
        quizType: "image",
        quizForms: updatedImageQuiz.screens,
      },
    });
  } catch (err) {
    console.error("Error in updateImageQuiz:", err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

const deleteImageQuiz = async (req, res) => {
  try {
    const result = await ImageQuiz.findByIdAndDelete(req.params.id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Image quiz not found" });
    }
    res.json({
      success: true,
      message: "Image quiz deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error deleting image quiz:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete image quiz" });
  }
};

module.exports = {
  saveImageQuizForm,
  getAllImageQuizzes,
  getImageQuizById,
  updateImageQuiz,
  deleteImageQuiz,
};
