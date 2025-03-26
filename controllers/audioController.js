const fs = require("fs").promises;
const path = require("path");

const uploadAudio = async (req, res) => {
  try {
    const page = parseInt(req.params.page);
    if (!req.file) return res.status(400).send("No audio file uploaded.");

    const musicFilePath = `/var/www/bestefar-html/data/audioFiles/audio${page}.mp3`;
    const jsonFilePath = "/var/www/bestefar-html/data/content/content.json";

    // const musicFilePath = `../../html/data/audioFiles/audio${page}.mp3`;
    // const jsonFilePath = "../../html/data/content/content.json";

    console.log(`Uploading music file to: ${musicFilePath}`);

    // Move uploaded file to the correct path
    await fs.writeFile(musicFilePath, req.file.buffer);

    // Read the existing JSON file
    let jsonData = {};
    try {
      const fileContent = await fs.readFile(jsonFilePath, "utf8");
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      console.warn("No existing JSON file found. Creating a new one.");
    }

    // Update JSON data
    if (!jsonData[`screen${page}`]) {
      jsonData[`screen${page}`] = {};
    }
    jsonData[`screen${page}`].firmNaming = `music${page}.mp3`;

    // Write updated JSON back to file
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(
      `✅ Audio file and JSON updated successfully for screen${page}`
    );

    res.status(200).json({
      success: true,
      message: `Audio file uploaded and JSON updated for page ${page}.`,
    });
  } catch (error) {
    console.error("❌ Error uploading music and updating JSON:", error);
    res.status(500).json({ error: "Failed to upload music and update JSON." });
  }
};

module.exports = { uploadAudio };
