const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  resourceUrl: { type: String, required: true, trim: true },
  description: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Material", materialSchema);
