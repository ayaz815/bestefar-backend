const saveImageQuizForm = async (req, res) => {
  const {
    page,
    quizName,
    question,
    answer,
    imageFileName,
    imageFileUrl,
    imageCaption,
    imageQuestionType,
    bitSize,
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

    // Ensure array has 16 slots
    while (jsonData[arrayName].length < 16) {
      jsonData[arrayName].push({
        page: jsonData[arrayName].length + 1,
        question: "",
        answer: "",
        imageFileName: "",
        imageFileUrl: "",
        imageCaption: "",
        imageQuestionType: imageQuestionType || "single-question",
        bitSize: "1",
        selectedAnswer: "",
        audioFileName: "",
        audioFileUrl: "",
        additionalNotes: "",
      });
    }

    // ✅ Update with ALL fields from the schema
    jsonData[arrayName][page - 1] = {
      page: parseInt(page),
      question: question || "",
      answer: answer || "",
      imageFileName: imageFileName || "",
      imageFileUrl: imageFileUrl || "",
      imageCaption: imageCaption || "",
      imageQuestionType: imageQuestionType || "single-question",
      bitSize: bitSize || "1",
      selectedAnswer: selectedAnswer || "",
      audioFileName: audioFileName || "",
      audioFileUrl: audioFileUrl || "",
      additionalNotes: additionalNotes || "",
    };

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    const pageNumber = parseInt(page);

    const screenData = {
      page: pageNumber,
      question: question || "",
      answer: answer || "",
      imageFileName: imageFileName || "",
      imageFileUrl: imageFileUrl || "",
      imageCaption: imageCaption || "",
      imageQuestionType: imageQuestionType || "single-question",
      bitSize: bitSize || "1",
      selectedAnswer: selectedAnswer || "",
      audioFileName: audioFileName || "",
      audioFileUrl: audioFileUrl || "",
      additionalNotes: additionalNotes || "",
    };

    let imageQuiz = await ImageQuiz.findOne({ quizName });

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
