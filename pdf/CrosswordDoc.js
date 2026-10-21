// Server-side port of the generator app's
// src/components/Crossword/CrosswordPDF.jsx (blank puzzle page + solution
// page). Same layout, transpiled from the JSX; only the font loading differs.
const path = require("path");
const React = require("react");
const {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} = require("@react-pdf/renderer");

const e = React.createElement;

// Same AGENCYB TTF the generator registers for the title.
Font.register({
  family: "AgencyFBBold",
  src: path.join(__dirname, "fonts", "AGENCYB.TTF"),
});

const MARGIN = 32;
const PAGE_W = 595;
const PAGE_H = 842;
const USABLE_W = PAGE_W - MARGIN * 2;
const CELL = Math.floor(USABLE_W / 15);
const GRID_W = CELL * 15;
const STOPPER = "#808080";
const RED = "#cc0000";
const s = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN + 20,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    backgroundColor: "#fff",
    fontFamily: "Helvetica"
  },
  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    width: GRID_W
  },
  title: {
    fontFamily: "AgencyFBBold",
    // Agency FB — Per Olav's requirement
    fontSize: 28,
    color: "#000",
    flex: 1,
    letterSpacing: 0.3
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 3,
    gap: 12
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#000"
  },
  metaLine: {
    width: 70,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    marginLeft: 4,
    height: 11
  },
  // ── Grid ─────────────────────────────────────────────────────────────────
  grid: {
    width: GRID_W,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#aaa",
    marginBottom: 16
  },
  row: { flexDirection: "row" },
  cellBlack: {
    width: CELL,
    height: CELL,
    backgroundColor: STOPPER,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#aaa"
  },
  cellWhite: {
    width: CELL,
    height: CELL,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#aaa",
    position: "relative"
  },
  cellNum: {
    position: "absolute",
    top: 2,
    left: 2,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    lineHeight: 1
  },
  cellLetter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    paddingTop: CELL / 2 - 8
  },
  // ── Clues ─────────────────────────────────────────────────────────────────
  clueRow: {
    flexDirection: "row",
    width: GRID_W,
    gap: 28
  },
  clueCol: { flex: 1 },
  clueHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    marginBottom: 5
  },
  clueItem: {
    flexDirection: "row",
    marginBottom: 3.5,
    alignItems: "flex-start"
  },
  clueNum: {
    width: 22,
    textAlign: "right",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: RED,
    marginRight: 4,
    flexShrink: 0
  },
  clueText: {
    fontSize: 9,
    color: "#000",
    flex: 1,
    lineHeight: 1.4
  },
  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 16,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 4
  },
  footerText: { fontSize: 7, color: "#aaa" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#000",
    color: "#fff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    padding: "2 5"
  }
});
function buildNumberMap(placedWords) {
  const map = {};
  (placedWords || []).forEach((pw) => {
    const key = `${pw.row},${pw.col}`;
    if (!map[key]) map[key] = pw.number;
  });
  return map;
}
const CWPage = ({ puzzle, showSolution }) => {
  const {
    grid = [],
    placedWords = [],
    quizName = "Kryssord",
    gridSize = 11
  } = puzzle;
  const SIZE = gridSize;
  const CELL_PT = Math.floor(USABLE_W / SIZE);
  const GRID_W_PT = CELL_PT * SIZE;
  const numMap = buildNumberMap(placedWords);
  const across = [...placedWords].filter((w) => w.direction === "across").sort((a, b) => a.number - b.number);
  const down = [...placedWords].filter((w) => w.direction === "down").sort((a, b) => a.number - b.number);
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  return /* @__PURE__ */ e(Page, { size: "A4", style: s.page }, /* @__PURE__ */ e(View, { style: [s.header, { width: GRID_W_PT }] }, /* @__PURE__ */ e(Text, { style: s.title }, quizName), /* @__PURE__ */ e(View, { style: s.metaGroup }, /* @__PURE__ */ e(Text, { style: s.metaLabel }, "Gruppe:"), /* @__PURE__ */ e(View, { style: s.metaLine }), /* @__PURE__ */ e(Text, { style: s.metaLabel }, "Dato:"), /* @__PURE__ */ e(View, { style: s.metaLine }))), /* @__PURE__ */ e(View, { style: [s.grid, { width: GRID_W_PT }] }, Array.from({ length: SIZE }).map((_, ri) => /* @__PURE__ */ e(View, { key: ri, style: s.row }, Array.from({ length: SIZE }).map((_2, ci) => {
    const letter = grid[ri]?.[ci];
    const isBlack = letter === null || letter === void 0;
    const num = numMap[`${ri},${ci}`];
    const cellStyle = {
      width: CELL_PT,
      height: CELL_PT,
      backgroundColor: isBlack ? STOPPER : "#fff",
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#aaa",
      position: "relative"
    };
    if (isBlack) return /* @__PURE__ */ e(View, { key: ci, style: cellStyle });
    return /* @__PURE__ */ e(View, { key: ci, style: cellStyle }, num ? /* @__PURE__ */ e(Text, { style: s.cellNum }, num) : null, showSolution && letter ? /* @__PURE__ */ e(
      Text,
      {
        style: [s.cellLetter, { paddingTop: CELL_PT / 2 - 8 }]
      },
      letter
    ) : null);
  })))), /* @__PURE__ */ e(View, { style: [s.clueRow, { width: GRID_W_PT }] }, /* @__PURE__ */ e(View, { style: s.clueCol }, /* @__PURE__ */ e(Text, { style: s.clueHeading }, "Vannrett:"), across.map((w) => /* @__PURE__ */ e(View, { key: w.number, style: s.clueItem }, /* @__PURE__ */ e(Text, { style: s.clueNum }, w.number, "."), /* @__PURE__ */ e(Text, { style: s.clueText }, w.clue || w.word)))), /* @__PURE__ */ e(View, { style: s.clueCol }, /* @__PURE__ */ e(Text, { style: s.clueHeading }, "Loddrett:"), down.map((w) => /* @__PURE__ */ e(View, { key: w.number, style: s.clueItem }, /* @__PURE__ */ e(Text, { style: s.clueNum }, w.number, "."), /* @__PURE__ */ e(Text, { style: s.clueText }, w.clue || w.word))))), showSolution && /* @__PURE__ */ e(Text, { style: s.badge }, "FASIT"), /* @__PURE__ */ e(View, { style: s.footer, fixed: true }, /* @__PURE__ */ e(Text, { style: s.footerText }, "bestefar.no"), /* @__PURE__ */ e(Text, { style: s.footerText }, today)));
};
const CrosswordPDFDocument = ({ puzzle }) => {
  const doc = puzzle?.data || puzzle || {};
  return /* @__PURE__ */ e(
    Document,
    {
      title: doc.quizName || "Kryssord",
      author: "Bestefar.no",
      language: "no"
    },
    /* @__PURE__ */ e(CWPage, { puzzle: doc, showSolution: false }),
    /* @__PURE__ */ e(CWPage, { puzzle: doc, showSolution: true })
  );
};
const CrosswordPDFBlank = ({ puzzle }) => {
  const doc = puzzle?.data || puzzle || {};
  return /* @__PURE__ */ e(
    Document,
    {
      title: doc.quizName || "Kryssord",
      author: "Bestefar.no",
      language: "no"
    },
    /* @__PURE__ */ e(CWPage, { puzzle: doc, showSolution: false })
  );
};
const CrosswordPDFSolution = ({ puzzle }) => {
  const doc = puzzle?.data || puzzle || {};
  return /* @__PURE__ */ e(
    Document,
    {
      title: (doc.quizName || "Kryssord") + " \u2014 Fasit",
      author: "Bestefar.no",
      language: "no"
    },
    /* @__PURE__ */ e(CWPage, { puzzle: doc, showSolution: true })
  );
};

module.exports = { CrosswordPDFDocument };
