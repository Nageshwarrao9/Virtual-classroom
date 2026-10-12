const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  startTime: { type: Date, required: true },
  meetingUrl: { type: String, trim: true, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("ClassSession", classSessionSchema);
