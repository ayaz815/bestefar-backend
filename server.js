require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const formRoutes = require("./routes/formRoutes");
const musicRoutes = require("./routes/musicRoutes");
const audioRoutes = require("./routes/audioRoutes");
const zipRoutes = require("./routes/zipRoutes");
const JSZip = require("jszip");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const compression = require("compression");
const Quiz = require("./models/Form");

const app = express();

// Database connection
connectDB();

// Middleware
app.use(express.json());
app.use(compression());
app.use(
  cors({
    origin: [
      "https://localhost:5174", // Allow local development
      "https://bestefar-frontend.s3-website.eu-north-1.amazonaws.com", // Allow S3 frontend
      "https://bestefar.no/html-generator-app/#/",
      "https://localhost:5173",
      "https://bestefar.no",
      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies and authentication headers
  })
);

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/zip", zipRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running and accessible via Nginx!");
});

// Endpoint to generate ZIP file
app.get("/download-zip", async (req, res) => {
  try {
    const zip = new JSZip();
    const dataFolder = path.join(__dirname, "./html/data");

    zip.file(
      "index.html",
      fs.readFileSync(path.join(__dirname, "./html/index.html"))
    );

    const addFilesToZip = (folderPath, zipFolder) => {
      const files = fs.readdirSync(folderPath);
      files.forEach((file) => {
        const fullPath = path.join(folderPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          addFilesToZip(fullPath, zipFolder.folder(file));
        } else {
          zipFolder.file(file, fs.readFileSync(fullPath));
        }
      });
    };

    addFilesToZip(dataFolder, zip.folder("data"));

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

app.get("/api/verify-mongo", async (req, res) => {
  try {
    const quizzes = await Quiz.find().limit(1);
    res.json({ connected: true, count: quizzes.length });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
