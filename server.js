require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const formRoutes = require("./routes/formRoutes");
const imageRoutes = require("./routes/imageRoutes");
const imageQuizRoutes = require("./routes/imageQuizRoutes");
const musicRoutes = require("./routes/musicRoutes");
const audioRoutes = require("./routes/audioRoutes");
const audioQuizRoutes = require("./routes/audioQuizRoutes");
const zipRoutes = require("./routes/zipRoutes");
const JSZip = require("jszip");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const compression = require("compression");
const Quiz = require("./models/Form");
const s3UploadRoute = require("./routes/s3UploadRoute");
const s3GetRoute = require("./routes/s3GetUrl");

const app = express();

// Database connection
connectDB();

// Middleware
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5176",
  "http://localhost:5175",
  "http://localhost:5174",
  "https://localhost:5173",
  "https://bestefar.no",
  "https://bestefar-frontend.s3-website.eu-north-1.amazonaws.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, curl)
      if (!origin) return callback(null, true);

      // Allow all localhost ports in development
      if (
        origin &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("https://localhost:"))
      ) {
        return callback(null, true);
      }

      // Check against whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("🚫 Blocked Origin:", origin);
      return callback(new Error("CORS not allowed from this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/image-quiz", imageQuizRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/audio-quiz", audioQuizRoutes);
app.use("/api/zip", zipRoutes);

app.use("/api/s3", s3UploadRoute);
app.use("/api/s3", s3GetRoute);
// app.use("/api/s3/download", s3GetRoute); // For presigned download URLs

app.use("/html", express.static(path.join(__dirname, "html")));

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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("📋 Available routes:");
  console.log("  - /api/forms");
  console.log("  - /api/image");
  console.log("  - /api/image-quiz");
  console.log("  - /api/music");
  console.log("  - /api/audio");
  console.log("  - /api/audio-quiz ✅");
  console.log("  - /api/zip");
  console.log("  - /api/s3/upload (presigned PUT URLs) ✅");
  console.log("  - /api/s3/download (presigned GET URLs) ✅");
});
