require("dotenv").config();
const express = require("express");
// const connectDB = require("./config/db");
const formRoutes = require("../routes/formRoutes");
const musicRoutes = require("../routes/musicRoutes");
const zipRoutes = require("../routes/zipRoutes");
const JSZip = require("jszip");
const path = require("path");
const fs = require("fs");

const app = express();

// Database connection
// connectDB();

// Middleware
app.use(express.json());
app.use(
  require("cors")({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/zip", zipRoutes);

// Test Route (To check if API is working)
app.get("/api", (req, res) => {
  res.send("API is running successfully!");
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
