const fs = require("fs");
const path = require("path");

const Quiz = require("../models/Form");

const saveForm = async (req, res) => {
  const {
    page,
    quizName,
    question,
    answer,
    firmNaming,
    musicName,
    artistName,
    additionalNotes,
  } = req.body;

  if (!page || !question || !answer || !firmNaming || !quizName) {
    return res.status(400).json({
      error: "Page, question, answer, firmNaming, and quizName are required.",
    });
  }

  try {
    // ✅ Step 1: Update local JSON file
    const isDev = process.env.NODE_ENV !== "production";
    const jsonFilePath = isDev
      ? path.resolve(__dirname, "../../html/data/content/content.json")
      : "/var/www/bestefar-html/data/content/content.json";

    // const jsonFilePath = "../../html/data/content/content.json";
    console.log("Resolved file path:", jsonFilePath);

    // Force fresh read of JSON file (avoid caching)
    let jsonData = {};
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = await fs.readFileSync(jsonFilePath, {
        encoding: "utf8",
        flag: "r",
      }); // Open file fresh each time
      jsonData = JSON.parse(fileContent);
    }

    // Update JSON data
    jsonData[`screen${page}`] = {
      quizName,
      question,
      answer,
      firmNaming,
      musicName,
      artistName,
      additionalNotes,
    };

    // Write updated JSON back to the file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`✅ JSON file updated successfully for screen${page}`);

    // ✅ Step 2: Upsert into MongoDB
    const quiz = await Quiz.findOneAndUpdate(
      { quizName },
      {
        $set: {
          [`screens.${page - 1}`]: {
            page,
            question,
            answer,
            firmNaming,
            musicName,
            artistName,
            additionalNotes,
          },
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log(`✅ MongoDB quiz updated for page ${page}`);

    return res.status(200).json({
      success: true,
      message: `Form saved successfully for page ${page}`,
      data: quiz,
    });
  } catch (error) {
    console.error("❌ Error saving form:", error);
    res.status(500).json({ error: "Failed to save form and update JSON." });
  }
};

module.exports = { saveForm };

// const Form = require("../models/Form");
// // const { writeFileSafe } = require("../utils/fileHandler");
// const AWS = require("aws-sdk");
// const fs = require("fs");
// const path = require("path");

// // Configure AWS S3
// // const s3 = new AWS.S3({
// //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// //   region: process.env.AWS_REGION,
// // });

// const saveForm = async (req, res) => {
//   const { page, question, answer, firmNaming } = req.body;

//   console.log(req.body);

//   // Validate input
//   if (!page || !question || !answer || !firmNaming) {
//     return res
//       .status(400)
//       .json({ error: "Page, question, answer, and firmNaming are required." });
//   }

//   try {
//     // Update JSON data
//     // const jsonFilePath = path.join(
//     //   __dirname,
//     //   "../../html/data/content/content.json"
//     // );
//     const jsonFilePath = "/var/www/bestefar-html/data/content/content.json";

//     console.log("Resolved file path:", jsonFilePath);

//     let jsonData = {};
//     if (fs.existsSync(jsonFilePath)) {
//       const fileContent = fs.readFileSync(jsonFilePath, "utf8");
//       jsonData = JSON.parse(fileContent);
//     }

//     // Update JSON data
//     jsonData[`screen${page}`] = { question, answer, firmNaming };

//     // Write back updated JSON
//     fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

//     console.log(`✅ JSON file updated successfully for screen${page}`);

//     try {
//       jsonData = require(jsonFilePath);
//     } catch (error) {
//       console.log("No existing JSON file found, creating a new one.");
//     }

//     jsonData[`screen${page}`] = { question, answer, firmNaming };

//     // Since we can't write to the local file system, store JSON elsewhere (e.g., S3)
//     // const jsonParams = {
//     //   Bucket: process.env.AWS_BUCKET_NAME,
//     //   Key: "content.json",
//     //   Body: JSON.stringify(jsonData, null, 2),
//     //   ContentType: "application/json",
//     // };

//     // await s3.upload(jsonParams).promise();
//     // console.log("JSON file uploaded successfully!");

//     // Handle music file upload if provided
//     // if (req.file) {
//     //   const musicParams = {
//     //     Bucket: process.env.AWS_BUCKET_NAME,
//     //     Key: `musicFiles/music${page}.mp3`,
//     //     Body: req.file.buffer,
//     //     ContentType: req.file.mimetype,
//     //   };

//     //   await s3.upload(musicParams).promise();
//     //   console.log(`Music file for page ${page} uploaded successfully!`);
//     // }

//     res.status(200).json({
//       message: `Form and music file (if provided) saved successfully for page ${page}.`,
//     });
//   } catch (error) {
//     console.error("Error saving form:", error);
//     res.status(500).json({ error: "Failed to save form and update JSON." });
//   }
// };

// module.exports = { saveForm };
