const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const util = require("util");

const pipelineAsync = util.promisify(pipeline);

const generateZip = async (req, res) => {
  try {
    const zip = new JSZip();
    const htmlFolderPath = "/var/www/bestefar-html";

    // Function to recursively add files to ZIP asynchronously
    const addFolderToZip = async (folderPath, zipFolder) => {
      const items = await fs.promises.readdir(folderPath);
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = await fs.promises.stat(itemPath);
        if (stat.isDirectory()) {
          await addFolderToZip(itemPath, zipFolder.folder(item));
        } else {
          const fileData = await fs.promises.readFile(itemPath);
          zipFolder.file(item, fileData);
        }
      }
    };

    // Add `html` folder to ZIP asynchronously
    await addFolderToZip(htmlFolderPath, zip.folder("bestefar-html"));

    // Generate ZIP as a stream
    const zipStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
    });

    // Set headers for ZIP download
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bestefar-html.zip"'
    );
    res.setHeader("Content-Type", "application/zip");

    // Pipe the ZIP stream to response properly
    await pipelineAsync(zipStream, res);
  } catch (error) {
    console.error("❌ Error generating ZIP file:", error);
    if (!res.headersSent) {
      res.status(500).send("Failed to generate ZIP file.");
    }
  }
};

module.exports = { generateZip };
