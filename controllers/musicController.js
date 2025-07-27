import fs from "fs/promises";
import path from "path";

export const uploadMusic = async (req, res) => {
  console.log("🎯 uploadMusic route hit");
  try {
    const page = parseInt(req.params.page);
    const file = req.file;
    const s3Url = req.body?.s3Url;

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
    // const musicFilePath = `../../html/data/musicFiles/music${page}.mp3`;
    // const jsonFilePath = "../../html/data/content/content.json";
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

// const fs = require("fs").promises;
// const path = require("path");

// const uploadMusic = async (req, res) => {
//   try {
//     const page = parseInt(req.params.page);
//     if (!req.file) return res.status(400).send("No music file uploaded.");

//     const musicFilePath = `/var/www/bestefar-html/data/musicFiles/music${page}.mp3`;
//     const jsonFilePath = "/var/www/bestefar-html/data/content/content.json";

//     // const musicFilePath = `../../html/data/musicFiles/music${page}.mp3`;
//     // const jsonFilePath = "../../html/datacontent/content.json";
//     console.log(`Uploading music file to: ${musicFilePath}`);

//     const musicDir = path.dirname(musicFilePath);

//     // Make sure the /musicFiles folder exists
//     await fs.mkdir(musicDir, { recursive: true });

//     // Move uploaded file to the correct path
//     await fs.writeFile(musicFilePath, req.file.buffer);

//     // Upload to S3
//     const s3Url = await uploadToS3(req.file.buffer, musicFileName);

//     // Read the existing JSON file
//     let jsonData = {};
//     try {
//       const fileContent = await fs.readFile(jsonFilePath, "utf8");
//       jsonData = JSON.parse(fileContent);
//       jsonData[`screen${page}`].musicFileUrl = s3Url;
//     } catch (error) {
//       console.warn("No existing JSON file found. Creating a new one.");
//     }

//     // Update JSON data
//     if (!jsonData[`screen${page}`]) {
//       jsonData[`screen${page}`] = {};
//     }
//     // jsonData[`screen${page}`].firmNaming = `music${page}.mp3`;
//     jsonData[`screen${page}`].musicFile = `music${page}.mp3`; // 🔁 Use a distinct key

//     // Write updated JSON back to file
//     await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

//     console.log(`✅ Music uploaded locally and to S3 for screen${page}`);

//     console.log(
//       `✅ Music file and JSON updated successfully for screen${page}`
//     );

//     res.status(200).json({
//       success: true,
//       message: `Music file uploaded and JSON updated for page ${page}.`,
//     });
//   } catch (error) {
//     console.error("❌ Error uploading music and updating JSON:", error);
//     res.status(500).json({ error: "Failed to upload music and update JSON." });
//   }
// };

// module.exports = { uploadMusic };

// const path = require("path");
// const fs = require("fs");

// const uploadMusic = (req, res) => {
//   const page = parseInt(req.params.page);

//   if (!req.file) return res.status(400).send("No music file uploaded.");

//   const tempPath = req.file.path;
//   // const targetPath = path.join(
//   //   __dirname,
//   //   `../../html/data/musicFiles/music${page}.mp3`
//   // );
//   const musicFilePath = `/var/www/bestefar-html/data/musicFiles/music${page}.mp3`;

//   fs.rename(tempPath, targetPath, (err) => {
//     if (err) {
//       console.error("Error replacing music file:", err);
//       return res.status(500).send("Failed to replace the music file.");
//     }
//     res.send(`Music file for page ${page} replaced successfully!`);
//   });
// };

// module.exports = { uploadMusic };
