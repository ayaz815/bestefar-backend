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
    optionA,
    optionB,
    optionC,
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

    // ✅ NEW: Use unified "questions" array format
    let jsonData = { questions: [] };

    // Load existing data if file exists
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, "utf8");
      const existingData = JSON.parse(fileContent);

      // Support both old and new formats
      if (existingData.questions) {
        jsonData.questions = existingData.questions;
      }
    }

    // Ensure array has 16 slots with minimal structure
    while (jsonData.questions.length < 16) {
      jsonData.questions.push({
        id: jsonData.questions.length + 1,
        type: "single", // default type
        question: "",
        media: "",
        audio: "",
        answer: "",
      });
    }

    const pageNumber = parseInt(page);

    // ✅ Check if quiz already exists and get existing screen data
    let existingImageQuiz = await ImageQuiz.findOne({ quizName });
    let existingScreen = null;

    if (existingImageQuiz) {
      existingScreen = existingImageQuiz.screens.find(
        (s) => s.page === pageNumber
      );
    }

    // ✅ Map imageQuestionType to the new type format
    let questionType;
    if (imageQuestionType === "bit-by-bit") {
      questionType = "bit";
    } else if (imageQuestionType === "single-question") {
      questionType = "single";
    } else if (imageQuestionType === "multiple-questions") {
      questionType = "multiple";
    } else {
      questionType = "single"; // default fallback
    }

    // Use unified media URL
    const mediaUrl = mediaFileUrl || existingScreen?.mediaFileUrl || "";
    const audioUrl = audioFileUrl || existingScreen?.audioFileUrl || "";

    // ✅ Build the unified question object
    let pageData = {
      id: pageNumber,
      type: questionType,
      question: question || "",
      image: mediaUrl, // Changed from 'media' to 'image' to match frontend
      audio: audioUrl,
      answer: answer || "",
    };

    // Add options array for multiple choice questions
    if (questionType === "multiple") {
      const options = [];
      if (optionA) options.push(optionA);
      if (optionB) options.push(optionB);
      if (optionC) options.push(optionC);

      // Ensure the correct answer is in the options
      if (answer && !options.includes(answer)) {
        options.push(answer);
      }

      pageData.options = options;
    }

    // Update the specific page in the array
    jsonData.questions[page - 1] = pageData;

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(
      `✅ Image quiz JSON updated for question ${page}:`,
      JSON.stringify(pageData, null, 2)
    );

    // ✅ Build screenData for MongoDB (keep existing structure)
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
      optionA: optionA || existingScreen?.optionA || "",
      optionB: optionB || existingScreen?.optionB || "",
      optionC: optionC || existingScreen?.optionC || "",
      audioFileName: audioFileName || existingScreen?.audioFileName || "",
      audioFileUrl: audioFileUrl || existingScreen?.audioFileUrl || "",
      additionalNotes: additionalNotes || existingScreen?.additionalNotes || "",
    };

    console.log("💾 Screen data to save:", JSON.stringify(screenData, null, 2));

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
        optionA: screen.optionA || "",
        optionB: screen.optionB || "",
        optionC: screen.optionC || "",
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
      optionA: screen.optionA || "",
      optionB: screen.optionB || "",
      optionC: screen.optionC || "",
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

// ✅ NEW: Function to randomize quiz types for all 16 questions
const randomizeQuizTypes = () => {
  const types = ["single", "multiple", "bit"];
  const questions = [];

  for (let i = 1; i <= 16; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    questions.push({
      id: i,
      type: randomType,
      question: "",
      image: "",
      audio: "",
      answer: "",
      ...(randomType === "multiple" && { options: [] }),
    });
  }

  return questions;
};

// ✅ NEW: Endpoint to generate new random quiz structure
const generateRandomQuiz = async (req, res) => {
  try {
    const { quizName } = req.body;

    if (!quizName) {
      return res.status(400).json({ error: "Quiz name is required" });
    }

    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html2/data/content/content.json";

    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    // Generate random structure
    const randomQuestions = randomizeQuizTypes();

    const jsonData = {
      questions: randomQuestions,
    };

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log("✅ Random quiz structure generated");

    return res.status(200).json({
      success: true,
      message: "Random quiz structure generated successfully",
      data: {
        quizName,
        questions: randomQuestions,
        distribution: {
          single: randomQuestions.filter((q) => q.type === "single").length,
          multiple: randomQuestions.filter((q) => q.type === "multiple").length,
          bit: randomQuestions.filter((q) => q.type === "bit").length,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error generating random quiz:", error);
    res.status(500).json({
      error: "Failed to generate random quiz structure",
      details: error.message,
    });
  }
};

module.exports = {
  saveImageQuizForm,
  getAllImageQuizzes,
  getImageQuizById,
  updateImageQuiz,
  deleteImageQuiz,
  generateRandomQuiz, // ✅ NEW export
};
