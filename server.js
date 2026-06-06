require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const formRoutes = require("./routes/formRoutes");
const imageRoutes = require("./routes/imageRoutes");
const imageQuizRoutes = require("./routes/imageQuizRoutes");
const audioQuizRoutes = require("./routes/audioQuizRoutes");
const musicRoutes = require("./routes/musicRoutes");
const audioRoutes = require("./routes/audioRoutes");
const zipRoutes = require("./routes/zipRoutes");
const imageMusicRoutes = require("./routes/imageMuiscQuizRoutes");
const JSZip = require("jszip");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const compression = require("compression");
const Quiz = require("./models/Form");
const s3Routes = require("./routes/s3UploadRoute");
const s3GetRouter = require("./routes/s3GetUrl");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();

// Database connection
connectDB();

// Middleware
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://localhost:5173",
  "https://bestefar.no",
  "https://bestefar-frontend.s3-website.eu-north-1.amazonaws.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
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
app.use("/api/audio-quiz", audioQuizRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/zip", zipRoutes);
app.use("/api/s3", s3Routes);
app.use("/api/s3", s3GetRouter);
app.use("/api/image-music", imageMusicRoutes);
app.use("/html", express.static(path.join(__dirname, "html")));

app.get("/", (req, res) => {
  res.send("Backend is running and accessible via Nginx!");
});

// ZIP download endpoint
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

// REST endpoint so display can poll current state if WebSocket drops
const roomState = {};

app.get("/api/sync/:room", (req, res) => {
  const state = roomState[req.params.room] || { index: 0, action: null };
  res.json(state);
});

// HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const room = url.searchParams.get("room") || "default";

  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);

  if (roomState[room]) ws.send(JSON.stringify(roomState[room]));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type !== "sync") return;

    roomState[room] = msg;
    rooms.get(room).forEach((client) => {
      if (client !== ws && client.readyState === 1)
        client.send(JSON.stringify(msg));
    });
  });

  ws.on("close", () => {
    rooms.get(room)?.delete(ws);
    if (rooms.get(room)?.size === 0) rooms.delete(room);
  });

  ws.on("error", () => ws.terminate());
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket ready on ws://localhost:${PORT}`);
});
