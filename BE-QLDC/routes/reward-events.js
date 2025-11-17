const express = require("express");
const { rewardEventController } = require("../controllers");
const { authenticate, isLeader } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, rewardEventController.getAll);
router.get("/:id", authenticate, rewardEventController.getById);
router.get("/:id/summary", authenticate, isLeader, rewardEventController.getSummary);
router.get("/:id/eligible-citizens", authenticate, isLeader, rewardEventController.getEligibleCitizens);
router.post("/", authenticate, isLeader, rewardEventController.create);
router.patch("/:id", authenticate, isLeader, rewardEventController.update);
router.delete("/:id", authenticate, isLeader, rewardEventController.delete);

module.exports = router;
