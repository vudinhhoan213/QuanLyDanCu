const mongoose = require("mongoose");
const {
  User,
  RewardDistribution,
  RewardEvent,
  RewardProposal,
  AuditLog,
  Notification,
} = require("../models");
require("dotenv").config();

async function clearAllRewardData() {
  try {
    // Kết nối database - SỬ DỤNG CÙNG URI VỚI createAdmin.js
    const mongoUri = process.env.MONGODB_ATLAS || process.env.MONGODB_URI || "mongodb://localhost:27017/quanlydancu";
    console.log("🔗 Đang kết nối database...");
    console.log("⚠️  CẢNH BÁO: Script này sẽ xóa TẤT CẢ dữ liệu khen thưởng!");
    console.log("⚠️  KHÔNG ảnh hưởng đến User, Citizen, Household\n");
    
    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối database");
    
    // Kiểm tra số lượng User trước khi xóa (để đảm bảo không xóa nhầm)
    const userCount = await User.countDocuments({});
    console.log(`\n👥 Số lượng User hiện tại: ${userCount}`);
    if (userCount === 0) {
      console.log("❌ CẢNH BÁO: Không có User nào! Có thể đã xóa nhầm database!");
      console.log("❌ Dừng script để tránh xóa nhầm!");
      await mongoose.connection.close();
      process.exit(1);
    }

    // Xóa theo thứ tự để tránh lỗi foreign key
    console.log("\n🗑️  Bắt đầu xóa dữ liệu khen thưởng...\n");

    // 1. Xóa RewardDistribution (phân phối quà)
    const distributionResult = await RewardDistribution.deleteMany({});
    console.log(`✅ Đã xóa ${distributionResult.deletedCount} bản ghi RewardDistribution`);

    // 2. Xóa RewardEvent (sự kiện phát quà)
    const eventResult = await RewardEvent.deleteMany({});
    console.log(`✅ Đã xóa ${eventResult.deletedCount} bản ghi RewardEvent`);

    // 3. Xóa RewardProposal (đề xuất khen thưởng)
    const proposalResult = await RewardProposal.deleteMany({});
    console.log(`✅ Đã xóa ${proposalResult.deletedCount} bản ghi RewardProposal`);

    // 4. Xóa AuditLog liên quan đến reward
    const auditResult = await AuditLog.deleteMany({
      entityType: { $in: ["RewardEvent", "RewardDistribution", "RewardProposal"] },
    });
    console.log(`✅ Đã xóa ${auditResult.deletedCount} bản ghi AuditLog liên quan đến reward`);

    // 5. Xóa Notification liên quan đến reward
    const notificationResult = await Notification.deleteMany({
      $or: [
        { type: "REWARD" },
        { entityType: "RewardProposal" },
      ],
    });
    console.log(`✅ Đã xóa ${notificationResult.deletedCount} bản ghi Notification liên quan đến reward`);

    // Tổng kết
    const totalDeleted =
      distributionResult.deletedCount +
      eventResult.deletedCount +
      proposalResult.deletedCount +
      auditResult.deletedCount +
      notificationResult.deletedCount;

    // Kiểm tra lại User sau khi xóa (đảm bảo không bị ảnh hưởng)
    const userCountAfter = await User.countDocuments({});
    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Hoàn thành! Đã xóa tổng cộng ${totalDeleted} bản ghi`);
    console.log("=".repeat(50));
    console.log("\n📊 Chi tiết:");
    console.log(`   - RewardDistribution: ${distributionResult.deletedCount}`);
    console.log(`   - RewardEvent: ${eventResult.deletedCount}`);
    console.log(`   - RewardProposal: ${proposalResult.deletedCount}`);
    console.log(`   - AuditLog (reward): ${auditResult.deletedCount}`);
    console.log(`   - Notification (REWARD): ${notificationResult.deletedCount}`);
    
    console.log("\n✅ Kiểm tra an toàn:");
    console.log(`   👥 User trước khi xóa: ${userCount}`);
    console.log(`   👥 User sau khi xóa: ${userCountAfter}`);
    if (userCount === userCountAfter) {
      console.log("   ✅ User không bị ảnh hưởng!");
    } else {
      console.log("   ❌ CẢNH BÁO: Số lượng User đã thay đổi!");
    }

    // Đóng kết nối
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi xóa dữ liệu:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Chạy script
clearAllRewardData();

