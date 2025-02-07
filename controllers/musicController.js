const path = require("path");
const fs = require("fs");

const uploadMusic = (req, res) => {
  const page = parseInt(req.params.page);

  if (!req.file) return res.status(400).send("No music file uploaded.");

  const tempPath = req.file.path;
  // const targetPath = path.join(
  //   __dirname,
  //   `../../html/data/musicFiles/music${page}.mp3`
  // );
  const musicFilePath = `/var/www/html/data/musicFiles/music${page}.mp3`;

  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error("Error replacing music file:", err);
      return res.status(500).send("Failed to replace the music file.");
    }
    res.send(`Music file for page ${page} replaced successfully!`);
  });
};

module.exports = { uploadMusic };
