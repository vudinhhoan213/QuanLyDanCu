const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../models/User");

async function checkAndFixAdmin() {
  try {
    // Kết nối MongoDB
    const mongoUri = process.env.MONGODB_ATLAS || process.env.MONGODB_URI || "mongodb://localhost:27017/quanlydancu";
    console.log("🔗 Đang kết nối database...");
    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB\n");

    // Tìm admin
    const admin = await User.findOne({ username: "admin" });
    
    if (!admin) {
      console.log("❌ Không tìm thấy tài khoản admin!");
      console.log("📝 Đang tạo tài khoản admin mới...\n");
      
      // Hash password
      const passwordHash = await bcrypt.hash("123456", 10);

      // Tạo tài khoản admin với role TO_TRUONG
      const newAdmin = await User.create({
        username: "admin",
        passwordHash: passwordHash,
        role: "TO_TRUONG", // Tổ trưởng
        fullName: "Quản trị viên",
        email: "admin@qldc.vn",
        phone: "0123456789",
        isActive: true,
        note: "Tài khoản quản trị hệ thống",
      });

      console.log("✅ Đã tạo tài khoản admin thành công!");
      console.log("=".repeat(50));
      console.log("Username:  admin");
      console.log("Password:  123456");
      console.log("Role:      TO_TRUONG (Tổ trưởng)");
      console.log("Full Name:", newAdmin.fullName);
      console.log("Email:    ", newAdmin.email);
      console.log("=".repeat(50));
    } else {
      console.log("✅ Tìm thấy tài khoản admin!");
      console.log("=".repeat(50));
      console.log("Username:  ", admin.username);
      console.log("Role:      ", admin.role);
      console.log("Full Name: ", admin.fullName);
      console.log("Email:     ", admin.email || "Chưa có");
      console.log("Phone:     ", admin.phone || "Chưa có");
      console.log("Active:    ", admin.isActive ? "✅ Có" : "❌ Không");
      console.log("=".repeat(50));

      // Kiểm tra role
      if (admin.role !== "TO_TRUONG") {
        console.log("\n⚠️  CẢNH BÁO: Role hiện tại là '" + admin.role + "', không phải TO_TRUONG!");
        console.log("📝 Đang cập nhật role thành TO_TRUONG...");
        admin.role = "TO_TRUONG";
        await admin.save();
        console.log("✅ Đã cập nhật role thành TO_TRUONG!");
      } else {
        console.log("\n✅ Role đã đúng: TO_TRUONG (Tổ trưởng)");
      }

      // Reset password về 123456
      console.log("\n📝 Đang reset mật khẩu về '123456'...");
      const passwordHash = await bcrypt.hash("123456", 10);
      admin.passwordHash = passwordHash;
      admin.isActive = true; // Đảm bảo tài khoản active
      await admin.save();
      
      console.log("✅ Đã reset mật khẩu thành công!");
      console.log("\n" + "=".repeat(50));
      console.log("🔐 THÔNG TIN ĐĂNG NHẬP:");
      console.log("=".repeat(50));
      console.log("Username:  admin");
      console.log("Password:  123456");
      console.log("Role:      TO_TRUONG (Tổ trưởng)");
      console.log("=".repeat(50));
      console.log("\n⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!");
    }

    // Kiểm tra các tài khoản TO_TRUONG khác
    const allLeaders = await User.find({ role: "TO_TRUONG" }).select("username fullName email isActive");
    console.log("\n📊 Danh sách tất cả tài khoản Tổ trưởng:");
    console.log("=".repeat(50));
    if (allLeaders.length === 0) {
      console.log("   Không có tài khoản nào");
    } else {
      allLeaders.forEach((leader, index) => {
        console.log(`   ${index + 1}. ${leader.username} - ${leader.fullName} (Active: ${leader.isActive ? "✅" : "❌"})`);
      });
    }

    // Đóng kết nối
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Chạy script
checkAndFixAdmin();

