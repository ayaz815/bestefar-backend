// Server-side port of the generator app's src/pdf/ParticipantPage.jsx.
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
  linesBox: { flexGrow: 1, marginTop: 5, justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center" },
  numCol: { width: 22, marginRight: 8, justifyContent: "center", paddingBottom: 30 },
  num: { fontFamily: "Arial", fontSize: 12, fontWeight: "bold", textAlign: "center" },
  writingCol: { flex: 1 },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: "#d8e1ea",
    borderBottomStyle: "solid",
    marginTop: 2,
  },
});

function ParticipantPage({ quizName = "Untitled Quiz" }) {
  const rows = Array.from({ length: 16 }, (_, i) => i + 1);

  return e(
    Page,
    { size: "A4", style: styles.page },
    e(
      View,
      { style: styles.headerRow },
      e(
        View,
        { style: styles.left },
        e(Text, { style: styles.title }, "Fyll inn svarene:"),
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
      rows.map((n) =>
        e(
          View,
          { key: n, style: styles.row },
          e(View, { style: styles.numCol }, e(Text, { style: styles.num }, String(n))),
          e(View, { style: styles.writingCol }, e(View, { style: styles.line }))
        )
      )
    )
  );
}

module.exports = ParticipantPage;
