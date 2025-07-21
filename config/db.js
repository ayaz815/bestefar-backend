const { MongoClient } = require("mongodb");

// const uri =
//   "mongodb+srv://bestefar-html-generator:Itsyazii@815@bestefar.oupgqdq.mongodb.net/?retryWrites=true&w=majority&appName=Bestefar";
const uri =
  "mongodb+srv://bestefar-html-generator:Itsyazii%40815@bestefar.oupgqdq.mongodb.net/?retryWrites=true&w=majority&appName=Bestefar";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected");
    return client.db("bestefar"); // use this db name consistently
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
