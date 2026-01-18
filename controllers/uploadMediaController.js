const fs = require("fs").promises;
const path = require("path");

const uploadMedia = async (req, res) => {
  console.log("🎯 uploadMedia route hit");
  try {
    const page = parseInt(req.params.page);
    const file = req.file;
    const s3Url = req.body?.publicUrl;

    if (!file) {
      console.warn("❗ No file received in uploadMedia.");
      return res.status(400).json({ error: "No file uploaded." });
    }

    const isDev = process.env.NODE_ENV !== "production";

    // ✅ Determine if it's an image or video
    const isVideo = file.mimetype.startsWith("video/");
    const isImage = file.mimetype.startsWith("image/");

    if (!isImage && !isVideo) {
      return res.status(400).json({
        error: "Invalid file type. Only images and videos are allowed.",
        receivedType: file.mimetype,
      });
    }

    // Determine file extension from mimetype
    const ext = file.mimetype.split("/")[1]; // e.g., "jpeg", "png", "webp", "mp4", "webm"
    const mediaType = isVideo ? "video" : "image";
    const fileName = `media${page}.${ext}`;

    // ✅ Store all media in unified folder
    const folderName = "mediaFiles";
    const filePath = isDev
      ? path.join(process.cwd(), `html/data/${folderName}`, fileName)
      : `/var/www/bestefar-html/data/${folderName}/${fileName}`;

    const jsonFilePath = isDev
      ? path.resolve(process.cwd(), "html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    console.log(`📥 Uploading ${mediaType} file to: ${filePath}`);

    // ✅ Save file locally
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.buffer);

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

    // ✅ Update unified media fields
    jsonData[`screen${page}`].mediaFile = fileName;
    jsonData[`screen${page}`].mediaType = mediaType;

    // ✅ Update file URL if S3 URL provided
    if (s3Url) {
      console.log(`🌐 S3 URL received: ${s3Url}`);
      jsonData[`screen${page}`].mediaFileUrl = s3Url;
    } else {
      console.log("ℹ️ No S3 URL provided, skipping URL update.");
    }

    // ✅ Save updated content.json
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`✅ JSON updated for screen${page}:`, {
      mediaFile: fileName,
      mediaFileUrl: s3Url || "local",
      mediaType: mediaType,
    });

    res.status(200).json({
      success: true,
      mediaType: mediaType,
      fileUrl: s3Url || `local://${fileName}`,
      fileName: fileName,
      updatedScreen: `screen${page}`,
      updatedFields: {
        mediaFile: fileName,
        mediaType: mediaType,
        ...(s3Url && { mediaFileUrl: s3Url }),
      },
    });
  } catch (err) {
    console.error("❌ uploadMedia error:", err);
    res.status(500).json({ error: "Failed to upload media file." });
  }
};

module.exports = { uploadMedia };
