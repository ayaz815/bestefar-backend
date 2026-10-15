const path = require("path");
const { pdf } = require("@react-pdf/renderer");
const React = require("react");
const AudioQuiz = require("../models/AudioQuiz");
const Quiz = require("../models/Form"); // Old model for backward compatibility
const AudioQuizDoc = require("../pdf/AudioQuizDoc");

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

    // In Node, @react-pdf/renderer's toBuffer() resolves to a readable
    // stream (despite the name), not an actual Buffer - collect it into
    // one before sending, otherwise Express can't tell it apart from a
    // plain object and tries (and fails) to JSON-serialize it.
    const pdfStream = await pdf(doc).toBuffer();
    const chunks = [];
    await new Promise((resolve, reject) => {
      pdfStream.on("data", (chunk) => chunks.push(chunk));
      pdfStream.on("end", resolve);
      pdfStream.on("error", reject);
    });
    const buffer = Buffer.concat(chunks);
    const safeName = (found.quizName || "Untitled").toString().trim().replace(/[^\w\- ]+/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="AudioQuiz_${safeName || "Untitled"}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating audio quiz PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

module.exports = { getAudioQuizPdf };
