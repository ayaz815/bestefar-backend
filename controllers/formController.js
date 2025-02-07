const Form = require("../models/Form");
// const { writeFileSafe } = require("../utils/fileHandler");
const AWS = require("aws-sdk");
const path = require("path");

// Configure AWS S3
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

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
    // Update JSON data
    // const jsonFilePath = path.join(
    //   __dirname,
    //   "../../html/data/content/content.json"
    // );
    const jsonFilePath = "/var/www/bestefar-html/data/content/content.json";

    console.log("Resolved file path:", jsonFilePath);

    let jsonData = {};
    try {
      jsonData = require(jsonFilePath);
    } catch (error) {
      console.log("No existing JSON file found, creating a new one.");
    }

    jsonData[`screen${page}`] = { question, answer, firmNaming };

    // Since we can't write to the local file system, store JSON elsewhere (e.g., S3)
    // const jsonParams = {
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: "content.json",
    //   Body: JSON.stringify(jsonData, null, 2),
    //   ContentType: "application/json",
    // };

    // await s3.upload(jsonParams).promise();
    // console.log("JSON file uploaded successfully!");

    // Handle music file upload if provided
    // if (req.file) {
    //   const musicParams = {
    //     Bucket: process.env.AWS_BUCKET_NAME,
    //     Key: `musicFiles/music${page}.mp3`,
    //     Body: req.file.buffer,
    //     ContentType: req.file.mimetype,
    //   };

    //   await s3.upload(musicParams).promise();
    //   console.log(`Music file for page ${page} uploaded successfully!`);
    // }

    res.status(200).json({
      message: `Form and music file (if provided) saved successfully for page ${page}.`,
    });
  } catch (error) {
    console.error("Error saving form:", error);
    res.status(500).json({ error: "Failed to save form and update JSON." });
  }
};

module.exports = { saveForm };
