const fs = require("fs").promises;
const path = require("path");

const uploadImage = async (req, res) => {
  console.log("🎯 uploadImage route hit");
  try {
    const page = parseInt(req.params.page);
    const file = req.file;
    const s3Url = req.body?.publicUrl;

    if (!file) {
      console.warn("❗ No image file received in uploadImage.");
      return res.status(400).json({ error: "No image file uploaded." });
    }

    const isDev = process.env.NODE_ENV !== "production";

    // Determine file extension from mimetype
    const ext = file.mimetype.split("/")[1]; // e.g., "jpeg", "png", "webp"
    const imageFileName = `image${page}.${ext}`;

    const imageFilePath = isDev
      ? path.join(process.cwd(), "html/data/imageFiles", imageFileName)
      : `/var/www/bestefar-html/data/imageFiles/${imageFileName}`;

    const jsonFilePath = isDev
      ? path.resolve(process.cwd(), "html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    console.log(`📥 Uploading image file to: ${imageFilePath}`);

    // ✅ Save image locally
    await fs.mkdir(path.dirname(imageFilePath), { recursive: true });
    await fs.writeFile(imageFilePath, file.buffer);

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

    // ✅ Always update local image filename
    jsonData[`screen${page}`].imageFile = imageFileName;

    // ✅ Update imageFileUrl if S3 URL provided
    if (s3Url) {
      console.log(`🌐 S3 URL received: ${s3Url}`);
      jsonData[`screen${page}`].imageFileUrl = s3Url;
    } else {
      console.log("ℹ️ No S3 URL provided, skipping imageFileUrl update.");
    }

    // ✅ Save updated content.json
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`✅ JSON updated for screen${page}:`, {
      imageFile: jsonData[`screen${page}`].imageFile,
      imageFileUrl: jsonData[`screen${page}`].imageFileUrl,
    });

    res.status(200).json({
      success: true,
      fileUrl: s3Url || `local://${imageFileName}`,
      updatedScreen: `screen${page}`,
      updatedFields: {
        imageFile: imageFileName,
        ...(s3Url && { imageFileUrl: s3Url }),
      },
    });
  } catch (err) {
    console.error("❌ uploadImage error:", err);
    res.status(500).json({ error: "Failed to upload image file." });
  }
};

module.exports = { uploadImage };
