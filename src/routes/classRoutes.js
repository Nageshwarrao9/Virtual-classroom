const express = require("express");
const ClassSession = require("../models/ClassSession");
const Course = require("../models/Course");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const upcomingFilter = { startTime: { $gte: new Date() } };
    let courseIds;
    if (req.user.role === "teacher") {
      const ownCourses = await Course.find({ teacher: req.user._id }).select("_id");
      courseIds = ownCourses.map(course => course._id);
    } else {
      const enrolled = await Course.find({ students: req.user._id }).select("_id");
      courseIds = enrolled.map(course => course._id);
    }
    const filter = { ...upcomingFilter, course: { $in: courseIds } };
    if (req.user.role === "teacher") filter.teacher = req.user._id;
    const sessions = await ClassSession.find(filter)
      .populate("course", "title")
      .populate("teacher", "name")
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Could not load class sessions." });
  }
});

router.post("/", protect, allowRoles("teacher"), async (req, res) => {
  try {
    const { courseId, title, startTime, meetingUrl } = req.body;
    if (!courseId || !title || !startTime) return res.status(400).json({ message: "Course, title and start time are required." });
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course) return res.status(404).json({ message: "Choose one of your own courses." });
    const parsedDate = new Date(startTime);
    if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Enter a valid start date and time." });
    const session = await ClassSession.create({
      course: course._id, teacher: req.user._id, title,
      startTime: parsedDate, meetingUrl: meetingUrl || ""
    });
    await session.populate("course", "title");
    res.status(201).json({ message: "Class scheduled.", session });
  } catch (error) {
    res.status(500).json({ message: "Could not schedule class." });
  }
});

module.exports = router;
