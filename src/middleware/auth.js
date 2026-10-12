const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in first." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_only_change_me");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Account not found." });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
}

module.exports = { protect, allowRoles };
