const express = require("express");

const router = express.Router();

const {
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resendForgotPasswordOTP,
} = require("../Controller/forgetPassword");
const {
    resetPassword,
} = require("../Controller/ResetPassword");

// ==========================================
// 1. SEND OTP
// ==========================================
router.post(
    "/send-otp",
    sendForgotPasswordOTP
);

// ==========================================
// 2. VERIFY OTP
// ==========================================
router.post(
    "/verify-otp",
    verifyForgotPasswordOTP
);

// ==========================================
// 3. RESEND OTP
// ==========================================
router.post(
    "/resend-otp",
    resendForgotPasswordOTP
);
router.post(
    "/reset-password",
    resetPassword
);

module.exports = router;