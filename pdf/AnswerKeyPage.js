// Server-side port of the generator app's src/pdf/AnswerKeyPage.jsx.
const React = require("react");
const { Page, View, Text, StyleSheet } = require("@react-pdf/renderer");
require("./registerFonts");

const e = React.createElement;

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingHorizontal: 36,
    paddingBottom: 40,
    fontFamily: "Arial",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  left: {},
  title: { fontFamily: "Arial", fontSize: 16, fontWeight: "normal", marginBottom: 2 },
  subRow: { flexDirection: "row", alignItems: "baseline" },
  label: { fontFamily: "Arial", fontSize: 16, fontWeight: "bold" },
  quizName: { fontFamily: "Arial", fontSize: 16, marginLeft: 6 },
  linesBox: { flexGrow: 1, marginTop: 12, justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "stretch" },
  numCol: { width: 22, marginRight: 8, justifyContent: "center" },
  num: { fontFamily: "Arial", fontSize: 12, fontWeight: "bold", textAlign: "left" },
  contentCol: { flex: 1, flexDirection: "column" },
  qText: { fontFamily: "Arial", fontSize: 12, fontWeight: "normal" },
  aText: { fontFamily: "Arial", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d8e1ea",
    borderBottomStyle: "solid",
    marginTop: 2,
  },
  spacer: { flexGrow: 1 },
});

function AnswerKeyPage({ quizName = "Untitled Quiz", slides = [] }) {
  const rows = Array.from({ length: 16 }, (_, i) => ({
    n: i + 1,
    q: slides[i]?.question ?? "",
    a: slides[i]?.answer ?? "",
  }));

  return e(
    Page,
    { size: "A4", style: styles.page },
    e(
      View,
      { style: styles.headerRow },
      e(
        View,
        { style: styles.left },
        e(Text, { style: styles.title }, "Spørsmål og svar:"),
        e(
          View,
          { style: styles.subRow },
          e(Text, { style: styles.label }, "AudioQuiz:"),
          e(Text, { style: styles.quizName }, quizName)
        )
      )
    ),
    e(
      View,
      { style: styles.linesBox },
      rows.map((r) =>
        e(
          View,
          { key: r.n, style: styles.row },
          e(View, { style: styles.numCol }, e(Text, { style: styles.num }, String(r.n))),
          e(
            View,
            { style: styles.contentCol },
            r.q ? e(Text, { style: styles.qText }, r.q) : null,
            r.a ? e(Text, { style: styles.aText }, r.a) : null,
            e(View, { style: styles.spacer }),
            e(View, { style: styles.divider })
          )
        )
      )
    )
  );
}

module.exports = AnswerKeyPage;
