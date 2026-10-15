// Server-side port of the generator app's src/pdf/AudioQuizDoc.jsx.
const React = require("react");
const { Document } = require("@react-pdf/renderer");
const TitlePage = require("./TitlePage");
const ParticipantPage = require("./ParticipantPage");
const AnswerKeyPage = require("./AnswerKeyPage");

const e = React.createElement;

function AudioQuizDoc({ quizName = "Untitled Quiz", quizForms = [], branding = {} }) {
  const slides = Array.from({ length: 16 }, (_, i) => quizForms[i] || {});
  const {
    logoUrl,
    bottomLogoUrl,
    brandName = "AudioQuiz",
    subtitleNo = "Her følger skjemaene for spørsmål og svar for utskrift og utdeling til deltagerne",
  } = branding;

  return e(
    Document,
    { title: `AudioQuiz_${quizName}` },
    e(TitlePage, { brandName, quizName, subtitleNo, logoUrl, bottomLogoUrl }),
    e(ParticipantPage, { quizName }),
    e(AnswerKeyPage, { quizName, slides })
  );
}

module.exports = AudioQuizDoc;
