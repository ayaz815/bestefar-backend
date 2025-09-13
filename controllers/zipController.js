// controllers/zipController.js
const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const util = require("util");

const pipelineAsync = util.promisify(pipeline);

// Adjust if your html folder path differs
const HTML_DIR = path.join(__dirname, "..", "html");
const INDEX_PATH = path.join(HTML_DIR, "index.html");
const DATA_DIR = path.join(HTML_DIR, "data");

/** Download index.html RAW (not zipped) */
const downloadIndexHtml = async (req, res) => {
  try {
    await fs.promises.access(INDEX_PATH, fs.constants.R_OK);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="index.html"');

    const readStream = fs.createReadStream(INDEX_PATH);
    readStream.on("error", (err) => {
      console.error("index.html stream error:", err);
      if (!res.headersSent) res.status(500).end("Failed to read index.html");
    });
    await pipelineAsync(readStream, res);
  } catch (error) {
    console.error("❌ downloadIndexHtml error:", error);
    if (!res.headersSent) res.status(500).send("Failed to download index.html");
  }
};

/** Recursively add a folder to a JSZip folder (sync FS for simplicity) */
const addFolderToZip = (folderPath, zipFolder) => {
  const entries = fs.readdirSync(folderPath);
  entries.forEach((entry) => {
    const full = path.join(folderPath, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      addFolderToZip(full, zipFolder.folder(entry));
    } else {
      zipFolder.file(entry, fs.readFileSync(full));
    }
  });
};

/** Download ONLY /html/data as data.zip */
const downloadDataZip = async (req, res) => {
  try {
    await fs.promises.access(DATA_DIR, fs.constants.R_OK);

    const zip = new JSZip();
    addFolderToZip(DATA_DIR, zip.folder("data"));

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="data.zip"');

    // Stream the zip to the response
    const zipStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
    });
    await pipelineAsync(zipStream, res);
  } catch (error) {
    console.error("❌ downloadDataZip error:", error);
    if (!res.headersSent) res.status(500).send("Failed to generate data.zip");
  }
};

module.exports = {
  downloadIndexHtml,
  downloadDataZip,
};
