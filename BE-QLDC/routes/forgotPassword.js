const express = require("express");
const router = express.Router();
const forgotPasswordController = require("../controllers/forgotPasswordController");

router.post("/send-otp", forgotPasswordController.sendOtp);
router.post("/verify-otp", forgotPasswordController.verifyOtp);
router.post("/reset-password", forgotPasswordController.resetPassword);

module.exports = router;
