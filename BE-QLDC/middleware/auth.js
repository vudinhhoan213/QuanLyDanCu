const jwt = require("jsonwebtoken");
const { User } = require("../models");

function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu thông tin user vào request
    req.user = payload; // {_id, username, role, fullName}

    // Shortcut để truy cập dễ dàng hơn
    req.userId = payload._id;
    req.userRole = payload.role;
    req.username = payload.username;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function isLeader(req, res, next) {
  if (!req.user || req.user.role !== "TO_TRUONG") {
    return res
      .status(403)
      .json({ message: "Forbidden: requires TO_TRUONG role" });
  }
  next();
}

function isCitizen(req, res, next) {
  if (!req.user || req.user.role !== "CONG_DAN") {
    return res
      .status(403)
      .json({ message: "Forbidden: requires CONG_DAN role" });
  }
  next();
}

module.exports = { authenticate, isLeader, isCitizen };
