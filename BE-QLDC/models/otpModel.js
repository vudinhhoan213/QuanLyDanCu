
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  code: { type: String, required: true },
  verified: { type: Boolean, default: false }, 
  expiresAt: { type: Date, required: true },
});

// Xóa tự động OTP sau khi hết hạn
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
