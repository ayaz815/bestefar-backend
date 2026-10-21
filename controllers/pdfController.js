const path = require("path");
const mongoose = require("mongoose");
const { pdf } = require("@react-pdf/renderer");
const React = require("react");
const AudioQuiz = require("../models/AudioQuiz");
const Quiz = require("../models/Form"); // Old model for backward compatibility
const ImageQuiz = require("../models/ImageQuiz");
const CrosswordShow = require("../models/CrosswordShow");
const AudioQuizDoc = require("../pdf/AudioQuizDoc");
const ImageQuizDoc = require("../pdf/ImageQuizDoc");
const { CrosswordPDFDocument } = require("../pdf/CrosswordDoc");

const e = React.createElement;

const LOGO_URL = path.join(__dirname, "../pdf/assets/Quiz_Logo.png");
const PARTNER_LOGO_URL = path.join(__dirname, "../pdf/assets/logo.jpeg");

// Mirrors the same two-model lookup + legacy-shape flattening already used
// by audioQuizController.getAudioQuizById, so this PDF always reflects the
// exact same quiz data the catalog/player show.
async function loadQuizForms(id) {
  let quiz = await AudioQuiz.findById(id);
  if (!quiz) quiz = await Quiz.findById(id);
  if (!quiz) return null;

  const quizForms = [];
  (quiz.screens || []).forEach((screen) => {
    if (!screen || typeof screen !== "object") return;
    const plain = typeof screen.toObject === "function" ? screen.toObject() : screen;
    if (plain.page != null) {
      quizForms.push(plain);
    } else {
      Object.values(plain).forEach((nested) => {
        if (nested && typeof nested === "object" && nested.page != null) {
          quizForms.push(nested);
        }
      });
    }
  });
  quizForms.sort((a, b) => (a.page || 0) - (b.page || 0));

  return { quizName: quiz.quizName, quizForms };
}

// In Node, @react-pdf/renderer's toBuffer() resolves to a readable stream
// (despite the name), not an actual Buffer - collect it into one before
// sending, otherwise Express can't tell it apart from a plain object and
// tries (and fails) to JSON-serialize it.
async function sendPdf(res, doc, prefix, quizName) {
  const pdfStream = await pdf(doc).toBuffer();
  const chunks = [];
  await new Promise((resolve, reject) => {
    pdfStream.on("data", (chunk) => chunks.push(chunk));
    pdfStream.on("end", resolve);
    pdfStream.on("error", reject);
  });
  const safeName = (quizName || "Untitled").toString().trim().replace(/[^\w\- ]+/g, "");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${prefix}_${safeName || "Untitled"}.pdf"`
  );
  res.send(Buffer.concat(chunks));
}

const getAudioQuizPdf = async (req, res) => {
  try {
    const found = await loadQuizForms(req.params.id);
    if (!found) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const doc = e(AudioQuizDoc, {
      quizName: found.quizName || "Untitled Quiz",
      quizForms: found.quizForms,
      branding: {
        brandName: "AudioQuiz",
        subtitleNo:
          "Her følger skjemaene for spørsmål og svar for utskrift og utdeling til deltagerne",
        logoUrl: LOGO_URL,
        bottomLogoUrl: PARTNER_LOGO_URL,
      },
    });

    await sendPdf(res, doc, "AudioQuiz", found.quizName);
  } catch (err) {
    console.error("❌ Error generating audio quiz PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// BildeQuiz: the generator's question sheet + answer sheet (pages/PdfDoc.jsx).
const getImageQuizPdf = async (req, res) => {
  try {
    const quiz = mongoose.isValidObjectId(req.params.id)
      ? await ImageQuiz.findById(req.params.id).lean()
      : null;
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // The sheet is indexed by position (row n = page n), like the form.
    const quizForms = [];
    (quiz.screens || []).forEach((s) => {
      quizForms[(parseInt(s.page) || 1) - 1] = s;
    });

    const doc = e(ImageQuizDoc, {
      quizName: quiz.quizName,
      quizForms,
      quizType: "image",
    });
    await sendPdf(res, doc, "BildeQuiz", quiz.quizName);
  } catch (err) {
    console.error("❌ Error generating image quiz PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// TekstQuiz (crossword): blank puzzle page + solution page, as in the generator.
const getCrosswordPdf = async (req, res) => {
  try {
    const quiz = mongoose.isValidObjectId(req.params.id)
      ? await CrosswordShow.findById(req.params.id).lean()
      : null;
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Older saves stored gridSize as {rows, cols}; newer ones as a number.
    const gridSize =
      typeof quiz.gridSize === "object" ? quiz.gridSize?.rows : quiz.gridSize;

    const doc = e(CrosswordPDFDocument, {
      puzzle: {
        quizName: quiz.quizName,
        grid: quiz.grid,
        placedWords: quiz.placedWords,
        gridSize: gridSize || 11,
      },
    });
    await sendPdf(res, doc, "Kryssord", quiz.quizName);
  } catch (err) {
    console.error("❌ Error generating crossword PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

module.exports = { getAudioQuizPdf, getImageQuizPdf, getCrosswordPdf };
