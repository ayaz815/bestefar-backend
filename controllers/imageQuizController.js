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
    bgColor,
    showId,
  } = req.body;

  if (!page) {
    return res.status(400).json({ error: "Page is required." });
  }
  if (!quizName || !quizName.toString().trim()) {
    return res.status(400).json({ error: "No show name" });
  }

  try {
    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html2/data/content/content.json";

    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    let jsonData = { quizName: "", questions: [] };
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, "utf8");
      const existingData = JSON.parse(fileContent);
      if (existingData.questions) jsonData.questions = existingData.questions;
    }

    while (jsonData.questions.length < 16) {
      jsonData.questions.push({
        id: jsonData.questions.length + 1,
        type: "single",
        question: "",
        media: "",
        audio: "",
        answer: "",
      });
    }

    const pageNumber = parseInt(page);

    let questionType = "single";
    if (imageQuestionType === "bit-by-bit") questionType = "bit";
    else if (imageQuestionType === "single-question") questionType = "single";
    else if (imageQuestionType === "multiple-questions")
      questionType = "multiple";

    // ── JSON file update ──────────────────────────────────────────────────────
    const pageData = {
      id: pageNumber,
      type: questionType,
      question: question || "",
      image: mediaFileUrl || "",
      audio: audioFileUrl || "",
      answer: answer || "",
      bgColor: bgColor || "#ffffff",
      notes: additionalNotes || "",
    };

    if (questionType === "bit") {
      pageData.bitSize = bitSize || "";
      pageData.bitRemovalDuration = bitRemovalDuration || "";
    }

    if (questionType === "multiple") {
      const options = [];
      if (optionA) options.push(optionA);
      if (optionB) options.push(optionB);
      if (optionC) options.push(optionC);
      if (answer && !options.includes(answer)) options.push(answer);
      pageData.options = options;
    }

    // ✅ Save quizName at root level of JSON
    jsonData.quizName = quizName || "";
    jsonData.questions[page - 1] = pageData;

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
    console.log(`✅ JSON updated for question ${page}`);

    // ── MongoDB update ────────────────────────────────────────────────────────
    const existingQuiz =
      showId && showId.trim() !== ""
        ? await ImageQuiz.findById(showId).lean()
        : null;

    if (existingQuiz) {
      const existingScreen =
        existingQuiz.screens.find((s) => parseInt(s.page) === pageNumber) || {};

      const screenData = {
        page: pageNumber,
        question: question || "",
        answer: answer || "",
        mediaFileName: mediaFileName || existingScreen.mediaFileName || "",
        mediaFileUrl: mediaFileUrl || existingScreen.mediaFileUrl || "",
        mediaType: mediaType || existingScreen.mediaType || "",
        imageCaption: imageCaption || existingScreen.imageCaption || "",
        imageQuestionType: imageQuestionType || "",
        bitSize: bitSize || "",
        bitRemovalDuration:
          bitRemovalDuration || existingScreen.bitRemovalDuration || "",
        selectedAnswer: selectedAnswer || existingScreen.selectedAnswer || "",
        optionA: optionA || existingScreen.optionA || "",
        optionB: optionB || existingScreen.optionB || "",
        optionC: optionC || existingScreen.optionC || "",
        audioFileName: audioFileName || existingScreen.audioFileName || "",
        audioFileUrl: audioFileUrl || existingScreen.audioFileUrl || "",
        additionalNotes:
          additionalNotes || existingScreen.additionalNotes || "",
        bgColor: bgColor || existingScreen.bgColor || "#ffffff",
      };

      const screens = existingQuiz.screens.map((s) =>
        parseInt(s.page) === pageNumber ? { ...s, ...screenData } : s
      );

      const pageAlreadyExists = existingQuiz.screens.some(
        (s) => parseInt(s.page) === pageNumber
      );
      if (!pageAlreadyExists && screens.length < 16) {
        screens.push(screenData);
        screens.sort((a, b) => a.page - b.page);
      }

      const updated = await ImageQuiz.findByIdAndUpdate(
        existingQuiz._id,
        {
          $set: {
            screens,
            quizName,
          },
        },
        { new: true, runValidators: false }
      );

      console.log(`✅ Saved page ${pageNumber} for quiz "${quizName}"`);
      return res.status(200).json({
        success: true,
        message: `Image quiz form saved successfully for page ${page}`,
        data: {
          id: updated._id,
          quizName: updated.quizName,
          quizType: "image",
          screen: screenData,
        },
      });
    } else {
      const screenData = {
        page: pageNumber,
        question: question || "",
        answer: answer || "",
        mediaFileName: mediaFileName || "",
        mediaFileUrl: mediaFileUrl || "",
        mediaType: mediaType || "",
        imageCaption: imageCaption || "",
        imageQuestionType: imageQuestionType || "",
        bitSize: bitSize || "",
        bitRemovalDuration: bitRemovalDuration || "",
        selectedAnswer: selectedAnswer || "",
        optionA: optionA || "",
        optionB: optionB || "",
        optionC: optionC || "",
        audioFileName: audioFileName || "",
        audioFileUrl: audioFileUrl || "",
        additionalNotes: additionalNotes || "",
        bgColor: bgColor || "#ffffff",
      };

      const imageQuiz = await ImageQuiz.create({
        quizName,
        quizType: "image",
        screens: [screenData],
      });

      console.log(`✅ Created new quiz "${quizName}" with page ${pageNumber}`);
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
    }
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
        mediaType: screen.mediaType || "",
        imageCaption: screen.imageCaption || "",
        imageQuestionType: screen.imageQuestionType || "",
        bitSize: screen.bitSize || "",
        bitRemovalDuration: screen.bitRemovalDuration || "",
        selectedAnswer: screen.selectedAnswer || "",
        audioFileName: screen.audioFileName || "",
        audioFileUrl: screen.audioFileUrl || "",
        additionalNotes: screen.additionalNotes || "",
        quizType: "image",
        optionA: screen.optionA || "",
        optionB: screen.optionB || "",
        optionC: screen.optionC || "",
        bgColor: screen.bgColor || "#ffffff",
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
      mediaType: screen.mediaType || "",
      imageCaption: screen.imageCaption || "",
      imageQuestionType: screen.imageQuestionType || "",
      bitSize: screen.bitSize || "",
      bitRemovalDuration: screen.bitRemovalDuration || "",
      selectedAnswer: screen.selectedAnswer || "",
      audioFileName: screen.audioFileName || "",
      audioFileUrl: screen.audioFileUrl || "",
      additionalNotes: screen.additionalNotes || "",
      quizType: "image",
      optionA: screen.optionA || "",
      optionB: screen.optionB || "",
      optionC: screen.optionC || "",
      bgColor: screen.bgColor || "#ffffff",
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
    const { quizName, quizForms } = req.body;

    if (!quizName || !Array.isArray(quizForms)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const validScreens = quizForms
      .filter((s) => s && s.page != null)
      .map((s) => ({ ...s, page: parseInt(s.page) }));

    const updatedImageQuiz = await ImageQuiz.findByIdAndUpdate(
      showId,
      {
        $set: {
          quizName,
          screens: validScreens,
        },
      },
      { new: true, runValidators: false }
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
    const randomQuestions = randomizeQuizTypes();
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify({ questions: randomQuestions }, null, 2),
      "utf8"
    );
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
  generateRandomQuiz,
};
