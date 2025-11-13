const express = require("express");
const { rewardDistributionController } = require("../controllers");
const { authenticate, isLeader, isCitizen } = require("../middleware/auth");

const router = express.Router();

// Citizen routes - ĐẶT TRƯỚC để tránh conflict với /:id
router.post("/register", authenticate, isCitizen, rewardDistributionController.register);
router.get("/my", authenticate, isCitizen, rewardDistributionController.getMyRegistrations);

// Leader routes
router.get("/", authenticate, isLeader, rewardDistributionController.getAll);
router.post("/", authenticate, isLeader, rewardDistributionController.create);
router.post(
  "/bulk",
  authenticate,
  isLeader,
  rewardDistributionController.bulkCreate
);
router.post(
  "/distribute",
  authenticate,
  isLeader,
  rewardDistributionController.distribute
);
router.post(
  "/generate-from-achievements",
  authenticate,
  isLeader,
  rewardDistributionController.generateFromAchievements
);
router.post(
  "/generate-from-age-range",
  authenticate,
  isLeader,
  rewardDistributionController.generateFromAgeRange
);
router.get(
  "/summary/event/:eventId",
  authenticate,
  isLeader,
  rewardDistributionController.summarizeByEvent
);

// Routes với :id phải đặt cuối cùng để tránh conflict
router.get(
  "/:id",
  authenticate,
  isLeader,
  rewardDistributionController.getById
);
router.patch(
  "/:id",
  authenticate,
  isLeader,
  rewardDistributionController.update
);
router.delete(
  "/:id",
  authenticate,
  isLeader,
  rewardDistributionController.delete
);

module.exports = router;
