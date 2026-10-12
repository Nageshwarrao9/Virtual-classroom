const express = require("express");
const Material = require("../models/Material");
const Course = require("../models/Course");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    let courseIds;
    if (req.user.role === "teacher") {
      const ownCourses = await Course.find({ teacher: req.user._id }).select("_id");
      courseIds = ownCourses.map(c => c._id);
    } else {
      const enrolled = await Course.find({ students: req.user._id }).select("_id");
      courseIds = enrolled.map(c => c._id);
    }
    const materials = await Material.find({ course: { $in: courseIds } })
      .populate("course", "title").sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: "Could not load study materials." });
  }
});

router.post("/", protect, allowRoles("teacher"), async (req, res) => {
  try {
    const { courseId, title, resourceUrl, description } = req.body;
    if (!courseId || !title || !resourceUrl) return res.status(400).json({ message: "Course, title and resource URL are required." });
    let parsed;
    try { parsed = new URL(resourceUrl); } catch { return res.status(400).json({ message: "Enter a valid URL, including https://." }); }
    if (!["http:", "https:"].includes(parsed.protocol)) return res.status(400).json({ message: "Only HTTP or HTTPS links are allowed." });
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course) return res.status(404).json({ message: "Choose one of your own courses." });
    const material = await Material.create({ course: course._id, teacher: req.user._id, title, resourceUrl, description: description || "" });
    await material.populate("course", "title");
    res.status(201).json({ message: "Study material added.", material });
  } catch (error) {
    res.status(500).json({ message: "Could not add study material." });
  }
});

module.exports = router;
