// Server-side port of the generator app's src/pdf/registerFonts.js.
// There, fonts are loaded via Vite's `?url` imports; here, @react-pdf/renderer
// accepts a plain local file path directly, so no build-step magic is needed.
const path = require("path");
const { Font } = require("@react-pdf/renderer");

const FONTS_DIR = path.join(__dirname, "fonts");

Font.register({
  family: "AgencyFB",
  fonts: [
    { src: path.join(FONTS_DIR, "AGENCYR.TTF"), fontWeight: "normal" },
    { src: path.join(FONTS_DIR, "AGENCYB.TTF"), fontWeight: "bold" },
  ],
});

Font.register({
  family: "Arial",
  fonts: [
    { src: path.join(FONTS_DIR, "arial.ttf"), fontWeight: "normal" },
    { src: path.join(FONTS_DIR, "arialbd.ttf"), fontWeight: "bold" },
    { src: path.join(FONTS_DIR, "ariali.ttf"), fontStyle: "italic" },
  ],
});
