require("dotenv").config();

const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

/* ========================
   DATABASE CONNECTION
======================== */
const uri = process.env.MONGO_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let historyCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("calculatorDB");
    historyCollection = db.collection("history");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}

connectDB();

/* ========================
   SAVE HISTORY
======================== */
app.post("/api/saveHistory", async (req, res) => {
  try {
    const { expression, result } = req.body;
    await historyCollection.insertOne({ expression, result, date: new Date() });
    res.json({ status: "saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

/* ========================
   GET HISTORY
======================== */
app.get("/api/history", async (req, res) => {
  try {
    const data = await historyCollection
      .find()
      .sort({ date: -1 })
      .limit(20)
      .toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/* ========================
   START SERVER
======================== */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
