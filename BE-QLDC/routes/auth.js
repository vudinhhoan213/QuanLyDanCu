const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User, Citizen, OTP } = require("../models");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Tạo transporter gửi mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================= LOGIN =======================
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
    req.user = user;

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

// ======================= REGISTER =======================
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

// ======================= ME =======================
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ======================= CHANGE PASSWORD =======================
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
});

// ======================= FORGOT PASSWORD & CHECK EMAIL) =======================
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email, checkOnly } = req.body;

    // ⚠️ 1️⃣ Kiểm tra dữ liệu đầu vào
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        exists: false,
        message: "Thiếu hoặc sai định dạng email",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 🔍 2️⃣ Kiểm tra người dùng có tồn tại không
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        exists: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    // ⚠️ 3️⃣ Trường hợp user tồn tại nhưng chưa có email (hiếm)
    if (!user.email || !user.email.trim()) {
      return res.status(400).json({
        exists: false,
        message: "Tài khoản này chưa có email được đăng ký",
      });
    }

    // ✅ 4️⃣ Nếu chỉ kiểm tra email (mode check)
    if (checkOnly === true) {
      return res.status(200).json({
        exists: true,
        message: "Email hợp lệ",
      });
    }

    // 🔄 5️⃣ Xóa OTP cũ (nếu có)
    await OTP.deleteMany({ email: cleanEmail });

    // 🎯 6️⃣ Tạo mã OTP mới
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await OTP.create({ email: cleanEmail, code: otpCode, expiresAt });

    // ✉️ 7️⃣ Gửi email OTP
    await transporter.sendMail({
      from: `"QLDC System" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: "Mã OTP đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otpCode}. Hiệu lực trong 5 phút.`,
    });

    console.log(`✅ OTP sent to ${cleanEmail}`);

    // ✅ 8️⃣ Trả kết quả
    return res.status(200).json({
      exists: true,
      message: "OTP đã được gửi về email của bạn",
    });
  } catch (err) {
    console.error("❌ Lỗi forgot-password:", err);
    return res.status(500).json({
      exists: false,
      message: "Lỗi máy chủ khi gửi OTP",
    });
  }
});


// ======================= VERIFY OTP =======================
router.post("/verify-otp", async (req, res, next) => {
  try {
    const { email, identifier, otp } = req.body;
    const targetEmail = email || identifier;

    console.log("🟢 VERIFY OTP BODY:", req.body);
    console.log("🔍 targetEmail:", targetEmail);
    console.log("🔍 otp:", otp);

    if (!targetEmail || !otp) {
      return res.status(400).json({ message: "Thiếu email hoặc mã OTP" });
    }

    // 👉 Thử tìm OTP theo cả email và identifier (đề phòng DB lưu khác key)
      const record = await OTP.findOne({
      $or: [
        { email: targetEmail, code: otp },
        { identifier: targetEmail, code: otp }
      ]
    });

    if (!record) {
      console.log("❌ Không tìm thấy OTP khớp trong DB");
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Mã OTP đã hết hạn" });
    }

    await OTP.updateOne(
      { _id: record._id },
      { $set: { verified: true } }
    );
    
    const result = await OTP.updateOne(
  { _id: record._id },
  { $set: { verified: true } }
);
    console.log("🟢 UPDATE RESULT:", result);
    console.log("✅ OTP hợp lệ và đã được đánh dấu là verified");
    res.json({ message: "OTP hợp lệ" });
  } catch (err) {
    console.error("💥 VERIFY OTP ERROR:", err);
    next(err);
  }
});




// ======================= RESET PASSWORD =======================
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, otp, newPassword, identifier } = req.body;
    const targetEmail = email || identifier;
    
    console.log("🟢 RESET PASSWORD REQUEST:");
    console.log("🔍 Full body:", req.body);
    console.log("🔍 Email:", email);
    console.log("🔍 Identifier:", identifier);
    console.log("🔍 Target Email:", targetEmail);
    console.log("🔍 OTP:", otp);
    console.log("🔍 New Password:", newPassword);

    if (!targetEmail || !otp || !newPassword)
      return res.status(400).json({ message: "Thiếu thông tin" });
    
    // 👉 LOG TẤT CẢ OTP RECORDS ĐỂ DEBUG - SỬA THÀNH targetEmail
    const allOtps = await OTP.find({
      $or: [
        { email: targetEmail },
        { identifier: targetEmail }
      ]
    });
    console.log("🔍 Tất cả OTP records cho", targetEmail, ":", allOtps);

    const record = await OTP.findOne({
      $or: [
        { email: targetEmail },
        { identifier: targetEmail }
      ],
      code: otp,
      verified: true // ✅ CHỈ CHẤP NHẬN OTP ĐÃ VERIFIED
    });

    console.log("🔍 OTP record đã verified tìm thấy:", record);

    if (!record) {
      console.log("❌ KHÔNG tìm thấy OTP khớp:");
      console.log("   - Target:", targetEmail);
      console.log("   - OTP:", otp);
      console.log("   - verified: true");
      console.log("   - Các OTP có sẵn:", allOtps.map(o => ({ 
        code: o.code, 
        email: o.email, 
        identifier: o.identifier,
        verified: o.verified,
        expiresAt: o.expiresAt 
      })));
      return res.status(400).json({ message: "Mã OTP không đúng hoặc chưa được xác thực" });
    }

    if (record.expiresAt < new Date()) {
      console.log("❌ OTP đã hết hạn:", record.expiresAt);
      console.log("   - Thời gian hiện tại:", new Date());
      return res.status(400).json({ message: "Mã OTP đã hết hạn" });
    }

    console.log("✅ OTP hợp lệ, tìm user...");

    // 👉 TÌM USER THEO targetEmail (có thể là email hoặc identifier)
    const user = await User.findOne({
      $or: [
        { email: targetEmail },
        { phone: targetEmail } // nếu identifier là số điện thoại
      ]
    });
    
    console.log("🔍 User tìm thấy:", user);

    if (!user) {
      console.log("❌ Không tìm thấy user với:", targetEmail);
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    console.log("✅ User hợp lệ, đang cập nhật password...");

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await OTP.deleteMany({
      $or: [
        { email: targetEmail },
        { identifier: targetEmail }
      ]
    });

    console.log("✅ Reset password thành công!");
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("💥 RESET PASSWORD ERROR:", err);
    next(err);
  }
});


module.exports = router;