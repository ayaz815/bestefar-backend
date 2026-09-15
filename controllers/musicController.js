const fs = require("fs/promises");
const path = require("path");

const uploadMusic = async (req, res) => {
  console.log("🎯 uploadMusic route hit");
  try {
    const page = parseInt(req.params.page);
    const file = req.file;
    const s3Url = req.body?.publicUrl;

    if (!file) {
      console.warn("❗ No music file received in uploadMusic.");
      return res.status(400).json({ error: "No music file uploaded." });
    }

    const isDev = process.env.NODE_ENV !== "production";
    const musicFileName = `music${page}.mp3`;

    const musicFilePath = isDev
      ? path.join(process.cwd(), "html/data/musicFiles", musicFileName)
      : `/var/www/bestefar-html/data/musicFiles/${musicFileName}`;

    const jsonFilePath = isDev
      ? path.resolve(process.cwd(), "html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    console.log(`📥 Uploading music file to: ${musicFilePath}`);
    // ✅ Save MP3 locally
    await fs.mkdir(path.dirname(musicFilePath), { recursive: true });
    await fs.writeFile(musicFilePath, file.buffer);

    // ✅ Read or initialize content.json
    let jsonData = {};
    try {
      const content = await fs.readFile(jsonFilePath, "utf8");
      jsonData = JSON.parse(content);
    } catch (err) {
      console.warn("⚠️ No existing content.json found. Starting fresh.");
    }

    if (!jsonData[`screen${page}`]) {
      jsonData[`screen${page}`] = {};
    }

    // ✅ Always update local music filename
    jsonData[`screen${page}`].musicFile = musicFileName;

    // ✅ Update musicFileUrl if provided
    if (s3Url) {
      console.log(`🌐 S3 URL received: ${s3Url}`);
      jsonData[`screen${page}`].musicFileUrl = s3Url;
    } else {
      console.log("ℹ️ No S3 URL provided, skipping musicFileUrl update.");
    }

    // ✅ Save updated content.json
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`✅ JSON updated for screen${page}:`, {
      musicFile: jsonData[`screen${page}`].musicFile,
      musicFileUrl: jsonData[`screen${page}`].musicFileUrl,
    });

    res.status(200).json({
      success: true,
      fileUrl: s3Url || `local://${musicFileName}`,
      updatedScreen: `screen${page}`,
      updatedFields: {
        musicFile: musicFileName,
        ...(s3Url && { musicFileUrl: s3Url }),
      },
    });
  } catch (err) {
    console.error("❌ uploadMusic error:", err);
    res.status(500).json({ error: "Failed to upload music file." });
  }
};

module.exports = { uploadMusic };
