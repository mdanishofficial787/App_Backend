const express = require("express");
const router = express.Router();

const {
    forgotPasswordRequest,
    checkPasswordResetStatus,
} = require("../Controller/forgetPassword");

const {
    resetPassword,
} = require("../Controller/ResetPassword");

// DRIVER FORGOT PASSWORD
router.post(
    "/forgot-password",
    forgotPasswordRequest
);

// CHECK ADMIN APPROVAL STATUS
router.post(
    "/forgot-password/status",
    checkPasswordResetStatus
);

// RESET PASSWORD AFTER ADMIN APPROVAL

router.post(
    "/reset-password",
    resetPassword
);

module.exports = router;