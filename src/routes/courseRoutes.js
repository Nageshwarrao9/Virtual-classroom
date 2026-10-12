const express = require("express");
const Course = require("../models/Course");
const ClassSession = require("../models/ClassSession");
const Material = require("../models/Material");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "name")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Could not load courses." });
  }
});

router.post("/", protect, allowRoles("teacher"), async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Course title and description are required." });
    const course = await Course.create({
      title, description, category: category || "General",
      level: ["Beginner", "Intermediate", "Advanced"].includes(level) ? level : "Beginner",
      teacher: req.user._id
    });
    await course.populate("teacher", "name");
    res.status(201).json({ message: "Course created.", course });
  } catch (error) {
    res.status(500).json({ message: "Could not create course." });
  }
});

router.delete("/:id", protect, allowRoles("teacher"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });

    // Only the teacher who created this course may delete it.
    if (!course.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: "You can delete only courses you created." });
    }

    // Remove dependent records too, so no orphaned classes/materials remain visible.
    await Promise.all([
      ClassSession.deleteMany({ course: course._id }),
      Material.deleteMany({ course: course._id })
    ]);
    await course.deleteOne();
    return res.json({ message: "Course and its scheduled classes and study materials deleted successfully." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid course ID." });
    }
    return res.status(500).json({ message: "Could not delete course." });
  }
});

router.post("/:id/enroll", protect, allowRoles("student"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (course.teacher.equals(req.user._id)) return res.status(400).json({ message: "Teachers cannot enroll in their own course." });
    if (course.students.some(id => id.equals(req.user._id))) return res.status(409).json({ message: "You are already enrolled." });
    course.students.push(req.user._id);
    await course.save();
    res.json({ message: "Enrollment successful." });
  } catch (error) {
    res.status(500).json({ message: "Could not enroll in course." });
  }
});

router.get("/mine/enrolled", protect, allowRoles("student"), async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id }).populate("teacher", "name").sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Could not load your courses." });
  }
});

router.get("/mine/teaching", protect, allowRoles("teacher"), async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Could not load your courses." });
  }
});

module.exports = router;
