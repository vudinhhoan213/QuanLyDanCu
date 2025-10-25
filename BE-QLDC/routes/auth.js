const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Citizen } = require("../models");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const identifier = (username || email || "").toLowerCase();

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Missing username/email or password" });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      // Kiểm tra xem có phải số điện thoại của nhân khẩu không phải chủ hộ không
      const nonHeadCitizen = await Citizen.findOne({
        phone: identifier,
        isHead: { $ne: true },
      });

      if (nonHeadCitizen) {
        return res.status(401).json({
          message: "Tài khoản không tồn tại",
          detail:
            "Chỉ chủ hộ mới có tài khoản đăng nhập. Vui lòng liên hệ chủ hộ hoặc tổ trưởng.",
        });
      }

      return res.status(401).json({
        message: "Tài khoản hoặc mật khẩu không đúng",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, fullName, role } = req.body || {};
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: (email || "").toLowerCase() },
      ],
    });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      email: (email || "").toLowerCase() || undefined,
      passwordHash,
      fullName,
      role,
    });

    const payload = {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
