const AWS = require("aws-sdk");

// Upload file to S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

app.post("/save-form", upload.single("musicFile"), async (req, res) => {
  const { quizName, firmNaming, question, answer } = req.body;
  const mp3File = req.file;

  try {
    const formData = {
      quizName,
      firmNaming,
      question,
      answer,
      mp3FileName: mp3File ? mp3File.originalname : null,
      timestamp: new Date().toISOString(),
    };

    // Save form data as JSON to S3
    const formKey = `forms/${quizName}.json`;
    await s3
      .putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: formKey,
        Body: JSON.stringify(formData, null, 2),
        ContentType: "application/json",
      })
      .promise();

    // Save music file to S3
    if (mp3File) {
      const musicKey = `musicFiles/${mp3File.originalname}`;
      await s3
        .putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: musicKey,
          Body: fs.createReadStream(mp3File.path),
          ContentType: mp3File.mimetype,
        })
        .promise();
    }

    res.send("Form data and MP3 file saved successfully!");
  } catch (error) {
    console.error("Error saving form data and MP3 file:", error);
    res.status(500).send("Failed to save form data and MP3 file.");
  }
});

app.post(
  "/upload-music/:page",
  upload.single("musicFile"),
  async (req, res) => {
    const page = req.params.page;
    const mp3File = req.file;

    if (!mp3File) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const musicKey = `musicFiles/music${page}.mp3`;

      // Upload music file to S3
      await s3
        .putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: musicKey,
          Body: fs.createReadStream(mp3File.path),
          ContentType: mp3File.mimetype,
        })
        .promise();

      res.send(`Music file for page ${page} replaced successfully!`);
    } catch (error) {
      console.error("Error replacing music file:", error);
      res.status(500).send("Failed to replace the music file.");
    }
  }
);

app.get("/download-zip", async (req, res) => {
  const zip = new JSZip();

  try {
    // Add index.html from S3
    const indexHtml = await s3
      .getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: "index.html",
      })
      .promise();
    zip.file("index.html", indexHtml.Body);

    // Add files from the data folder in S3
    const dataKeys = ["forms/", "musicFiles/"];
    for (const keyPrefix of dataKeys) {
      const list = await s3
        .listObjectsV2({
          Bucket: process.env.AWS_S3_BUCKET,
          Prefix: keyPrefix,
        })
        .promise();

      for (const file of list.Contents) {
        const fileData = await s3
          .getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.Key,
          })
          .promise();

        zip.file(file.Key, fileData.Body);
      }
    }

    // Generate the ZIP and send it to the client
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=html_project.zip"
    );
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (error) {
    console.error("Error generating ZIP file:", error);
    res.status(500).send("Failed to generate ZIP file.");
  }
});

// Endpoint to update HTML file content
app.post("/save-form", (req, res) => {
  const { page, question, answer, firmNaming } = req.body;

  // Path to the target HTML file (adjust path as needed)
  const filePath = path.join(__dirname, `../html/data/screen${page}.html`);

  try {
    // Read the HTML file
    let htmlContent = fs.readFileSync(filePath, "utf8");

    // Replace placeholders with updated content
    htmlContent = htmlContent
      .replace(/{{question}}/g, question)
      .replace(/{{answer}}/g, answer)
      .replace(/{{firmNaming}}/g, firmNaming);

    // Save the updated HTML back to the file
    fs.writeFileSync(filePath, htmlContent, "utf8");

    res.send(`HTML file for page ${page} updated successfully!`);
  } catch (error) {
    console.error("Error updating HTML file:", error);
    res.status(500).send("Failed to update HTML file.");
  }
});
