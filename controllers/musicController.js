const fs = require("fs").promises;
const path = require("path");

const uploadMusic = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const fileType = req.body.fileType; // "music" or "audio"

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    let filePath;
    if (fileType === "music") {
      filePath = `/var/www/bestefar-html/data/musicFiles/music${page}.mp3`;
    } else if (fileType === "audio") {
      filePath = `/var/www/bestefar-html/data/audioFiles/audio${page}.mp3`;
    } else {
      return res.status(400).json({ error: "Invalid fileType provided." });
    }

    console.log(`Uploading ${fileType} file to: ${filePath}`);

    // Save the uploaded file
    await fs.writeFile(filePath, req.file.buffer);

    // ✅ Update JSON File
    const jsonFilePath = "/var/www/bestefar-html/data/content/content.json";
    let jsonData = {};

    try {
      const fileContent = await fs.readFile(jsonFilePath, "utf8");
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      console.warn("⚠️ No existing JSON file found. Creating a new one.");
    }

    // Update JSON based on file type
    if (!jsonData[`screen${page}`]) {
      jsonData[`screen${page}`] = {};
    }

    if (fileType === "music") {
      jsonData[`screen${page}`].musicFile = `music${page}.mp3`;
    } else if (fileType === "audio") {
      jsonData[`screen${page}`].audioFile = `audio${page}.mp3`;
    }

    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(
      `✅ ${fileType} file uploaded & JSON updated for screen${page}`
    );

    res.status(200).json({
      success: true,
      message: `${fileType} file uploaded & JSON updated for page ${page}.`,
    });
  } catch (error) {
    console.error(`❌ Error uploading ${fileType}:`, error);
    res.status(500).json({ error: `Failed to upload ${fileType}.` });
  }
};

module.exports = { uploadMusic };
