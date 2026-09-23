const Customer = require("../schema/user");
const PasswordResetRequest = require("../schema/PasswordResetRequest");
const OTP = require("../schema/otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================================
// POST /api/auth/forgot-password/send-otp (repurposed for Admin Request)
// body: { email }
// ==========================================
module.exports.sendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const customer = await Customer.findOne({
            Email: normalizedEmail
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            });
        }

        // Check for existing recent requests to enforce 15-minute cooldown
        const existingRequest = await PasswordResetRequest.findOne({
            email: normalizedEmail,
            userType: "Customer",
            status: "Pending"
        }).sort({ createdAt: -1 });

        if (existingRequest) {
            const timeSinceLastRequest = Date.now() - new Date(existingRequest.createdAt).getTime();
            const fifteenMinutes = 15 * 60 * 1000;

            if (timeSinceLastRequest < fifteenMinutes) {
                const minutesLeft = Math.ceil((fifteenMinutes - timeSinceLastRequest) / 60000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${minutesLeft} minute(s) before sending another request.`,
                });
            }
        }

        // Clear any previous Pending requests that are OLDER than 15 minutes
        await PasswordResetRequest.deleteMany({ email: normalizedEmail, userType: "Customer", status: "Pending" });

        // Create a new request for Admin Approval
        await PasswordResetRequest.create({
            email: normalizedEmail,
            userType: "Customer",
            status: "Pending"
        });

        console.log("Password reset request sent for admin approval:", normalizedEmail);

        return res.status(200).json({
            success: true,
            message: "Request sent to Admin for approval."
        });

    } catch (err) {
        console.error("Send Forgot Password Request Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};

// ==========================================
// GET /api/auth/forgot-password/status?email=xyz
// ==========================================
module.exports.checkPasswordResetStatus = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const request = await PasswordResetRequest.findOne({
            email: normalizedEmail,
            userType: "Customer"
        }).sort({ createdAt: -1 });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "No password reset request found."
            });
        }

        return res.status(200).json({
            success: true,
            status: request.status,
            resetToken: request.resetToken
        });
    } catch (err) {
        console.error("Check Status Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};

// ==========================================
// POST /api/auth/forgot-password/reset-password
// body: { resetToken, newPassword, confirmPassword }
// ==========================================
module.exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "resetToken, newPassword and confirmPassword are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        let payload;
        try {
            payload = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Reset link expired or invalid."
            });
        }

        if (payload.purpose !== "password_reset") {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            });
        }

        const customer = await Customer.findById(payload.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        customer.Password = hashedPassword;
        await customer.save();

        // Clear any previous OTPs or ResetRequests for this customer
        await OTP.deleteMany({ customerId: customer._id });
        await PasswordResetRequest.deleteMany({ email: customer.Email, userType: "Customer" });

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });

    } catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};