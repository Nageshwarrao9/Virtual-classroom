const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || "development_only_change_me", { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const safeRole = role === "teacher" ? "teacher" : "student";
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: safeRole });
    res.status(201).json({
      message: "Registration successful.",
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not register. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({
      message: "Login successful.",
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not log in. Please try again." });
  }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
