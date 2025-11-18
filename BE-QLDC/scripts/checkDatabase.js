const mongoose = require("mongoose");
const { User, RewardDistribution, RewardEvent, RewardProposal } = require("../models");
require("dotenv").config();

async function checkDatabase() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_ATLAS || process.env.MONGODB_URI || "mongodb://localhost:27017/quanlydancu";
    console.log("🔗 Đang kết nối database...");
    console.log("📍 URI:", mongoUri.replace(/\/\/.*@/, "//***:***@")); // Ẩn password
    
    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối database\n");

    // Kiểm tra số lượng User
    const userCount = await User.countDocuments({});
    console.log(`👥 Số lượng User: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find({}).select("username role fullName isActive").limit(10);
      console.log("\n📋 Danh sách User (10 đầu tiên):");
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role}) - ${user.fullName} - Active: ${user.isActive}`);
      });
      
      const adminCount = await User.countDocuments({ role: "ADMIN" });
      console.log(`\n   👑 Số lượng Admin: ${adminCount}`);
      
      if (adminCount === 0) {
        console.log("\n⚠️  KHÔNG CÓ ADMIN! Cần tạo lại admin.");
      }
    } else {
      console.log("\n❌ KHÔNG CÓ USER NÀO! Dữ liệu đã bị xóa!");
    }

    // Kiểm tra số lượng Reward data
    const rewardDistCount = await RewardDistribution.countDocuments({});
    const rewardEventCount = await RewardEvent.countDocuments({});
    const rewardProposalCount = await RewardProposal.countDocuments({});
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 Thống kê dữ liệu:");
    console.log("=".repeat(50));
    console.log(`   👥 User: ${userCount}`);
    console.log(`   🎁 RewardDistribution: ${rewardDistCount}`);
    console.log(`   📅 RewardEvent: ${rewardEventCount}`);
    console.log(`   💰 RewardProposal: ${rewardProposalCount}`);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Chạy script
checkDatabase();

