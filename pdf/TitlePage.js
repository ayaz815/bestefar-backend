// Server-side port of the generator app's src/pdf/TitlePage.jsx.
// Written with React.createElement instead of JSX since the backend has no
// JSX transpiler configured - the structure/styling is otherwise identical.
const React = require("react");
const { Page, View, Text, Image, StyleSheet } = require("@react-pdf/renderer");
require("./registerFonts");

const e = React.createElement;

const A4 = { width: 595.28, height: 841.89 };
const PAD_TOP = 54;
const PAD_BOTTOM = 64;
const PAD_X = 54;

const CONTENT_WIDTH = A4.width - PAD_X * 2;
const SUBTITLE_WIDTH = Math.round(A4.width * 0.85) - PAD_X * 2;

const styles = StyleSheet.create({
  page: {
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
    paddingHorizontal: PAD_X,
    position: "relative",
  },
  logoWrap: { alignItems: "center", marginBottom: 22, marginTop: 22 },
  brand: {
    fontFamily: "AgencyFB",
    fontSize: 80,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 28,
    fontWeight: "normal",
  },
  quizTitle: {
    fontFamily: "Arial",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 28,
    fontWeight: "bold",
  },
  subtitleWrap: { width: SUBTITLE_WIDTH, alignSelf: "center" },
  subtitle: {
    fontFamily: "Arial",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 1.4,
    fontWeight: "normal",
  },
  bottomLogoWrap: {
    position: "absolute",
    left: PAD_X,
    right: PAD_X,
    bottom: 96,
    alignItems: "center",
  },
});

function TitlePage({
  brandName,
  quizName,
  subtitleNo,
  logoUrl,
  bottomLogoUrl,
  topLogoSize = 160,
}) {
  return e(
    Page,
    { size: "A4", style: styles.page },
    e(
      View,
      { style: styles.logoWrap },
      logoUrl
        ? e(Image, { src: logoUrl, style: { width: topLogoSize, height: topLogoSize } })
        : null
    ),
    e(Text, { style: styles.brand }, brandName || "AudioQuiz"),
    e(Text, { style: styles.quizTitle }, quizName || "Uregistrert quiz"),
    e(
      View,
      { style: styles.subtitleWrap },
      e(
        Text,
        { style: styles.subtitle },
        subtitleNo ||
          "Her følger skjemaene for spørsmål og svar for utskrift og utdeling til deltagerne"
      )
    ),
    bottomLogoUrl
      ? e(
          View,
          { style: styles.bottomLogoWrap },
          e(Image, { src: bottomLogoUrl, style: { width: 180 } })
        )
      : null
  );
}

module.exports = TitlePage;
