require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./src/routes/authRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const classRoutes = require("./src/routes/classRoutes");
const materialRoutes = require("./src/routes/materialRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Virtual Classroom API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/materials", materialRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

// Return JSON for invalid JSON bodies instead of an opaque Express HTML error page.
app.use((error, req, res, next) => {
  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body. Please send valid JSON." });
  }
  console.error("Unhandled request error:", error);
  return res.status(500).json({ message: "Unexpected server error." });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/virtual_classroom";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Virtual Classroom running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    console.error("Check that MongoDB is running and MONGODB_URI in .env is correct.");
    process.exit(1);
  });
