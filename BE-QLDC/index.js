// Load environment variables FIRST
const path = require("path");
const dotenvPath = path.resolve(__dirname, ".env");
console.log("🔍 Loading .env from:", dotenvPath);
const dotenvResult = require("dotenv").config({ path: dotenvPath });

if (dotenvResult.error) {
  console.error("❌ ERROR loading .env:", dotenvResult.error);
} else {
  console.log("✅ .env file loaded successfully");
  console.log("📋 Loaded variables:", Object.keys(dotenvResult.parsed || {}));
}

// Validate required environment variables
if (!process.env.MONGODB_ATLAS) {
  console.error("❌ ERROR: MONGODB_ATLAS is not defined in .env file");
  console.error("   Current value:", process.env.MONGODB_ATLAS);
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET is not defined in .env file");
  console.error("   Current value:", process.env.JWT_SECRET);
  process.exit(1);
}

console.log("✅ Environment variables loaded:");
console.log("   - MONGODB_ATLAS:", process.env.MONGODB_ATLAS ? "✅" : "❌");
console.log("   - JWT_SECRET:", process.env.JWT_SECRET ? "✅" : "❌");
console.log("   - PORT:", process.env.PORT || 3001);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const householdRoutes = require("./routes/households");
const citizenRoutes = require("./routes/citizens");
const requestRoutes = require("./routes/requests");
const rewardRoutes = require("./routes/rewards");
const notificationRoutes = require("./routes/notifications");
const rewardEventRoutes = require("./routes/reward-events");
const rewardDistributionRoutes = require("./routes/reward-distributions");
const studentAchievementRoutes = require("./routes/student-achievements");
const auditRoutes = require("./routes/audit");
const setupRoutes = require("./routes/setup");

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error:", error);
  }
};

const startServer = async () => {
  await connectDB();

  // Routes
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/households", householdRoutes);
  app.use("/citizens", citizenRoutes);
  app.use("/requests", requestRoutes);
  app.use("/rewards", rewardRoutes);
  app.use("/reward-events", rewardEventRoutes);
  app.use("/reward-distributions", rewardDistributionRoutes);
  app.use("/student-achievements", studentAchievementRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/audit", auditRoutes);
  app.use("/setup", setupRoutes);

  // Basic health route
  app.get("/health", (req, res) => res.json({ ok: true }));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Server is running on port ${port}`));
};

startServer();
