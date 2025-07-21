// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://bestefar-html-generator:Itsyazii%40815@bestefar.oupgqdq.mongodb.net/bestefar?retryWrites=true&w=majority&appName=Bestefar",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "bestefar", // Ensures correct DB
      }
    );
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
