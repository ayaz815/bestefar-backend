const fs = require("fs").promises;
const path = require("path");

const uploadAudio = async (req, res) => {
  try {
    const page = parseInt(req.params.page);
    const file = req.file;

    if (!file) return res.status(400).send("No audio file uploaded.");

    const isDev = process.env.NODE_ENV !== "production";

    const audioFileName = `audio${page}.mp3`;
    const audioFilePath = isDev
      ? path.join(process.cwd(), "html/data/audioFiles", audioFileName)
      : `/var/www/bestefar-html/data/audioFiles/${audioFileName}`;

    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    // const musicFilePath = `../../html/data/audioFiles/audio${page}.mp3`;
    // const jsonFilePath = "../../html/data/content/content.json";

    console.log(`Uploading audio file to: ${audioFilePath}`);

    // ✅ Ensure folder exists before saving
    await fs.mkdir(path.dirname(audioFilePath), { recursive: true });
    await fs.writeFile(audioFilePath, file.buffer);

    // ✅ Load or initialize content.json
    let jsonData = {};
    try {
      const content = await fs.readFile(jsonFilePath, "utf8");
      jsonData = JSON.parse(content);
    } catch (error) {
      console.warn("No existing content.json found. Initializing new.");
    }

    if (!jsonData[`screen${page}`]) {
      jsonData[`screen${page}`] = {};
    }

    // ✅ Always update local file reference
    jsonData[`screen${page}`].audioFile = audioFileName;

    // ✅ Optionally update S3 URL if passed
    if (req.body.s3Url) {
      jsonData[`screen${page}`].audioFileUrl = req.body.s3Url;
    }

    // ✅ Ensure JSON folder exists
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });

    // ✅ Write updated JSON
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(
      `✅ Audio file and JSON updated successfully for screen${page}`
    );

    res.status(200).json({
      success: true,
      fileUrl: req.body.s3Url || `local://${audioFileName}`,
    });
  } catch (error) {
    console.error("❌ Error uploading audio and updating JSON:", error);
    res.status(500).json({ error: "Failed to upload audio and update JSON." });
  }
};

module.exports = { uploadAudio };
