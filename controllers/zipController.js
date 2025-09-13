const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");

const streamPipeline = promisify(pipeline);

const BASE_DIR = "/var/www/bestefar-html";
const INDEX_FILE = path.join(BASE_DIR, "index.html");
const DATA_FOLDER = path.join(BASE_DIR, "data");

async function addFolderToZip(folderPath, zip, zipPath = "") {
  const entries = await fs.promises.readdir(folderPath, {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const absolutePath = path.join(folderPath, entry.name);
    const zipEntryPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await addFolderToZip(absolutePath, zip, zipEntryPath);
    } else {
      const fileData = await fs.promises.readFile(absolutePath);
      zip.file(zipEntryPath, fileData);
    }
  }
}

async function sendIndexFile(req, res) {
  try {
    await fs.promises.access(INDEX_FILE);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="index.html"');
    await streamPipeline(fs.createReadStream(INDEX_FILE), res);
  } catch {
    res.status(404).send("index.html not found");
  }
}

async function sendDataZip(req, res) {
  try {
    await fs.promises.access(DATA_FOLDER);
    const zip = new JSZip();
    await addFolderToZip(DATA_FOLDER, zip, "data");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="data.zip"');
    const zipStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
    });
    await streamPipeline(zipStream, res);
  } catch {
    res.status(404).send("data folder not found");
  }
}

module.exports = { sendIndexFile, sendDataZip };
