// Server-side port of the generator app's src/pages/PdfDoc.jsx (the BildeQuiz
// question + answer sheets). Same layout, transpiled from the JSX; only the
// asset/font loading differs (local files instead of Vite imports).
const path = require("path");
const React = require("react");
const {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} = require("@react-pdf/renderer");

const e = React.createElement;

const ASSETS = path.join(__dirname, "assets");
const logo = path.join(ASSETS, "logo.jpeg");
const like = path.join(ASSETS, "like.png");
const unlike = path.join(ASSETS, "unlike.png");

Font.register({
  family: "AGENCYR",
  src: path.join(__dirname, "fonts", "AGENCYR.TTF"),
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "AGENCYR"
  },
  coverContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 130,
    textAlign: "center"
  },
  title: {
    fontSize: 42,
    fontWeight: 700,
    marginBottom: 4,
    fontFamily: "AGENCYR"
  },
  subtitle: { fontSize: 22, marginBottom: 5 },
  themeLabel: { fontSize: 22, marginTop: 5 },
  themeName: { fontSize: 28, marginBottom: 20 },
  instructions: { fontSize: 22, width: "70%", lineHeight: 1.4, marginTop: 10 },
  boldText: { marginTop: 15, fontSize: 22, fontWeight: 700 },
  logo: { width: 180, marginTop: 30 },
  headerRowFirst: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5
  },
  quizName: { fontSize: 14 },
  tableHeaderText: { fontSize: 15, marginBottom: 5 },
  tableHeaderTextCentered: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center"
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#999",
    borderLeftWidth: 0
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    minHeight: 36
  },
  colNumber: {
    width: "5%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6
  },
  colQuestion: {
    width: "42%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center"
  },
  colAnswer: {
    width: "36%",
    borderRightWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    padding: 6
  },
  colLike: {
    width: "8.5%",
    borderRightWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center"
  },
  colDislike: {
    width: "8.5%",
    justifyContent: "center",
    alignItems: "center"
  },
  numberText: { fontSize: 22, fontWeight: "bold" },
  questionText: { fontSize: 11, lineHeight: 1.3, color: "#555" },
  answerText: { fontSize: 11, lineHeight: 1.3, textAlign: "center" },
  abcOption: {
    fontSize: 18,
    marginHorizontal: 10
  },
  correctAnswerText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.3
  },
  hintText: { fontSize: 10, marginBottom: 5, color: "#444" }
});
const IconHeaderCell = ({ src, widthPct }) => /* @__PURE__ */ e(
  View,
  {
    style: { width: widthPct, alignItems: "center", justifyContent: "center" }
  },
  /* @__PURE__ */ e(Image, { src, style: { width: 20, height: 20 } })
);
const ColumnHeaders = ({
  leftLabel = "Sp\xF8rsm\xE5lene:",
  answerLabel = "Svarene:"
}) => /* @__PURE__ */ e(View, { style: styles.headerRow }, /* @__PURE__ */ e(View, { style: { width: "47%", justifyContent: "center" } }, /* @__PURE__ */ e(Text, { style: styles.tableHeaderText }, leftLabel)), /* @__PURE__ */ e(
  View,
  {
    style: { width: "36%", alignItems: "center", justifyContent: "center" }
  },
  /* @__PURE__ */ e(Text, { style: styles.tableHeaderTextCentered }, answerLabel)
), /* @__PURE__ */ e(IconHeaderCell, { src: like, widthPct: "8.5%" }), /* @__PURE__ */ e(IconHeaderCell, { src: unlike, widthPct: "8.5%" }));
const TableRow = ({ number, questionText, answerCell }) => /* @__PURE__ */ e(View, { style: styles.row, wrap: false }, /* @__PURE__ */ e(View, { style: styles.colNumber }, /* @__PURE__ */ e(Text, { style: styles.numberText }, number)), /* @__PURE__ */ e(View, { style: styles.colQuestion }, /* @__PURE__ */ e(Text, { style: styles.questionText }, questionText || "\u2014")), /* @__PURE__ */ e(View, { style: styles.colAnswer }, answerCell), /* @__PURE__ */ e(View, { style: styles.colLike }), /* @__PURE__ */ e(View, { style: styles.colDislike }));
const DynamicPDFDocument = ({
  quizName = "",
  quizForms = [],
  quizType = "image"
}) => {
  const normalizedForms = Array(16).fill(null).map((_, i) => quizForms[i] || {});
  const formTypes = normalizedForms.map((form) => ({
    ...form,
    type: form.imageQuestionType || "single-question"
  }));
  const hasMultiple = formTypes.some((f) => f.type === "multiple-questions");
  return /* @__PURE__ */ e(Document, null, /* @__PURE__ */ e(Page, { size: "A4", style: styles.page }, /* @__PURE__ */ e(View, { style: styles.coverContainer }, /* @__PURE__ */ e(Text, { style: styles.title }, "Velkommen til ", quizType === "image" ? "BildeQuiz" : "MusikkQuiz"), /* @__PURE__ */ e(Text, { style: styles.subtitle }, "- en ny dimensjon innen kunnskapsleker"), /* @__PURE__ */ e(Text, { style: styles.themeLabel }, "Tema:"), /* @__PURE__ */ e(Text, { style: styles.themeName }, quizName), /* @__PURE__ */ e(Text, { style: styles.instructions }, "Skriv ut de f\xF8lgende 2 sidene \u2013 henholdsvis f\xF8r og etter svarene er avgitt \u2013 og del ut til deltagerne."), /* @__PURE__ */ e(Text, { style: styles.boldText }, hasMultiple ? "Blandet versjon" : "Ett svar versjon"), /* @__PURE__ */ e(Image, { src: logo, style: styles.logo }))), /* @__PURE__ */ e(Page, { size: "A4", style: styles.page }, /* @__PURE__ */ e(View, { style: styles.headerRowFirst }, /* @__PURE__ */ e(Text, { style: styles.quizName }, quizName)), /* @__PURE__ */ e(ColumnHeaders, { leftLabel: "Sp\xF8rsm\xE5lene:", answerLabel: "Svarene:" }), /* @__PURE__ */ e(Text, { style: styles.hintText }, hasMultiple ? "Sett en ring rundt det korrekte svaret (A B C for flervalgssp\xF8rsm\xE5l)" : "Skriv svaret ditt i feltet til h\xF8yre"), /* @__PURE__ */ e(View, { style: styles.table }, formTypes.map((form, index) => {
    const isMultiple = form.type === "multiple-questions";
    const answerCell = isMultiple ? /* @__PURE__ */ e(
      View,
      {
        style: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center"
        }
      },
      /* @__PURE__ */ e(Text, { style: styles.abcOption }, "A"),
      /* @__PURE__ */ e(Text, { style: styles.abcOption }, "B"),
      /* @__PURE__ */ e(Text, { style: styles.abcOption }, "C")
    ) : /* @__PURE__ */ e(Text, { style: styles.answerText }, " ");
    return /* @__PURE__ */ e(
      TableRow,
      {
        key: index,
        number: index + 1,
        questionText: form.question,
        answerCell
      }
    );
  }))), /* @__PURE__ */ e(Page, { size: "A4", style: styles.page }, /* @__PURE__ */ e(View, { style: styles.headerRowFirst }, /* @__PURE__ */ e(Text, { style: styles.quizName }, quizName)), /* @__PURE__ */ e(ColumnHeaders, { leftLabel: "Sp\xF8rsm\xE5lene:", answerLabel: "Svarene:" }), /* @__PURE__ */ e(Text, { style: styles.hintText }, hasMultiple ? "Sett en strek under det korrekte svaret (for flervalgssp\xF8rsm\xE5l)" : "Fasit"), /* @__PURE__ */ e(View, { style: styles.table }, formTypes.map((form, index) => {
    const isMultiple = form.type === "multiple-questions";
    const correctAnswer = form.selectedAnswer || "\u2014";
    const answerCell = isMultiple ? /* @__PURE__ */ e(View, { style: { alignItems: "center" } }, /* @__PURE__ */ e(Text, { style: styles.correctAnswerText }, correctAnswer, ": ", form[`option${correctAnswer}`] || "\u2014")) : /* @__PURE__ */ e(Text, { style: styles.answerText }, form.answer || "\u2014");
    return /* @__PURE__ */ e(
      TableRow,
      {
        key: index,
        number: index + 1,
        questionText: form.question,
        answerCell
      }
    );
  }))));
};
module.exports = DynamicPDFDocument;
