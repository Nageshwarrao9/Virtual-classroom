const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, default: "General" },
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
