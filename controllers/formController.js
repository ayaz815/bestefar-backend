const Form = require("../models/Form");
const { writeFileSafe } = require("../utils/fileHandler");
const path = require("path");
const fs = require("fs");

const saveForm = async (req, res) => {
  const { page, question, answer, firmNaming } = req.body;

  console.log(req.body);

  // Validate input
  if (!page || !question || !answer || !firmNaming) {
    return res
      .status(400)
      .json({ error: "Page, question, answer, and firmNaming are required." });
  }

  try {
    // Construct file path for JSON file
    const jsonFilePath = path.join(
      __dirname,
      "../../html/data/content/content.json"
    );

    console.log("Resolved file path:", jsonFilePath);

    // Read existing data or initialize new object
    let jsonData = {};
    try {
      jsonData = require(jsonFilePath);
    } catch (error) {
      console.log("No existing JSON file found, creating a new one.");
    }

    // Update JSON data
    jsonData[`screen${page}`] = { question, answer, firmNaming };

    // Write updated data to JSON file
    writeFileSafe(jsonFilePath, JSON.stringify(jsonData, null, 2));

    // Handle music file upload if provided
    if (req.file) {
      const tempPath = req.file.path;
      const musicFilePath = path.join(
        __dirname,
        `../../html/data/musicFiles/music${page}.mp3`
      );

      try {
        // Move uploaded music file to target directory
        fs.renameSync(tempPath, musicFilePath);
        console.log(`Music file for page ${page} replaced successfully!`);
      } catch (fileError) {
        console.error("Error replacing music file:", fileError);
        return res
          .status(500)
          .json({ error: "Failed to replace the music file." });
      }
    }

    // Send success response
    res.status(200).json({
      message: `Form and music file (if provided) saved successfully for page ${page}.`,
    });
  } catch (error) {
    console.error("Error saving form:", error);
    res.status(500).json({ error: "Failed to save form and update JSON." });
  }
};

module.exports = { saveForm };
