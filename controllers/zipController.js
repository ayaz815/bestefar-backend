const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const util = require("util");

const pipelineAsync = util.promisify(pipeline);

const generateZip = async (req, res) => {
  try {
    const { quizType } = req.query; // Get quiz type from query parameter

    const zip = new JSZip();

    // Determine HTML folder path based on quiz type
    const htmlFolderPath =
      quizType === "image"
        ? "/var/www/bestefar-html2" // Image quiz HTML folder
        : "/var/www/bestefar-html"; // Audio quiz HTML folder

    console.log(
      `📦 Generating ZIP for ${
        quizType || "audio"
      } quiz from: ${htmlFolderPath}`
    );

    // Check if folder exists
    if (!fs.existsSync(htmlFolderPath)) {
      console.error(`❌ Folder not found: ${htmlFolderPath}`);
      return res.status(404).json({
        error: `HTML folder not found for ${quizType || "audio"} quiz`,
        path: htmlFolderPath,
      });
    }

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

    // Add folder to ZIP with appropriate name
    const folderName =
      quizType === "image" ? "bestefar-html2" : "bestefar-html";
    await addFolderToZip(htmlFolderPath, zip.folder(folderName));

    // Generate ZIP as a stream
    const zipStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
    });

    // Set headers for ZIP download with appropriate filename
    const zipFileName =
      quizType === "image"
        ? "bestefar-image-quiz.zip"
        : "bestefar-audio-quiz.zip";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );
    res.setHeader("Content-Type", "application/zip");

    console.log(`✅ Sending ${zipFileName} to client`);

    // Pipe the ZIP stream to response properly
    await pipelineAsync(zipStream, res);
  } catch (error) {
    console.error("❌ Error generating ZIP file:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate ZIP file",
        details: error.message,
      });
    }
  }
};

module.exports = { generateZip };
