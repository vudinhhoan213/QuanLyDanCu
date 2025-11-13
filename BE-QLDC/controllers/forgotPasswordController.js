const bcrypt = require("bcryptjs");
const OTP = require("../models/otpModel");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Twilio client
const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Nodemailer transporter
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📨 Gửi OTP (SMS nếu có phone, Email nếu không)
exports.sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ message: "Thiếu email hoặc số điện thoại" });

    const cleanId = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }],
    });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Xóa OTP cũ (nếu có)
    await OTP.deleteMany({ identifier: cleanId });

    // Tạo mã OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào DB
    await OTP.create({
      identifier: cleanId,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });



    // --- FALLBACK: gửi qua Gmail ---
    // ✅ Chỉ gửi OTP nếu user có email
if (!user.email) {
  return res
    .status(400)
    .json({ message: "Người dùng chưa có email, không thể gửi OTP." });
}

// --- Gửi OTP qua Email ---
await mailer.sendMail({
  from: `"QLDC System" <${process.env.EMAIL_USER}>`,
  to: user.email,
  subject: "Mã OTP khôi phục mật khẩu",
  text: `Mã OTP của bạn là: ${code}. Mã sẽ hết hạn sau 5 phút.`,
});

console.log(`✅ OTP sent via Email to ${user.email}`);
return res.json({ message: "Đã gửi OTP qua Email thành công!" });

  } catch (err) {
    console.error("❌ sendOtp error:", err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
};

// ✅ Xác thực OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    console.log("🔍 VERIFY OTP - Input:", { identifier, otp }); 
    if (!identifier || !otp)
      return res.status(400).json({ message: "Thiếu thông tin" });

    const cleanId = identifier.trim().toLowerCase();
    const cleanOtp = otp.toString().trim(); 
    console.log("🔍 VERIFY OTP - Cleaned:", { cleanId, cleanOtp }); 
    const record = await OTP.findOne({ identifier: cleanId, code:cleanOtp });
    console.log("🔍 VERIFY OTP - Record found:", record); 
    if (!record) return res.status(400).json({ message: "OTP không đúng" });

    if (record.expiresAt < Date.now()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    await OTP.deleteOne({ _id: record._id });
    console.log("✅ VERIFY OTP - Success"); 


    return res.json({success: true, message: "Xác thực thành công!" });
  } catch (err) {
    console.error("❌ verifyOtp error:", err);
    res.status(500).json({ message: "Lỗi xác thực OTP" });
  }
};

// 🔒 Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword)
      return res.status(400).json({ message: "Thiếu thông tin" });

    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }],
    });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashed;
    await user.save();

    await OTP.deleteMany({ identifier: cleanId });

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("❌ resetPassword error:", err);
    res.status(500).json({ message: "Đặt lại mật khẩu thất bại" });
  }
};
