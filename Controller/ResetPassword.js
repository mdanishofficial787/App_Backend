const bcrypt = require("bcryptjs");
const Driver = require("../Schema/Driver");
const Otp = require("../Schema/OTP.JS");

// ==========================================
// RESET DRIVER PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            driverId,
            NewPassword,
            ConfirmPassword,
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!driverId || !NewPassword || !ConfirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Driver ID, new password and confirm password are required",
            });
        }

        // ==========================================
        // CHECK PASSWORD MATCH
        // ==========================================

        if (NewPassword !== ConfirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password and confirm password do not match",
            });
        }

        // ==========================================
        // FIND VERIFIED OTP
        // ==========================================

        const otpRecord = await Otp.findOne({
            driverId: driverId,
            verified: true,
        }).sort({
            createdAt: -1,
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Please verify OTP first",
            });
        }

        // ==========================================
        // FIND DRIVER
        // ==========================================

        const driver = await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver account not found",
            });
        }

        // ==========================================
        // HASH NEW PASSWORD
        // ==========================================

        const hashedPassword = await bcrypt.hash(
            NewPassword,
            10
        );

        // ==========================================
        // UPDATE PASSWORD
        // ==========================================

        driver.Password = hashedPassword;

        await driver.save();

        // ==========================================
        // DELETE USED OTP
        // ==========================================

        await Otp.deleteMany({
            driverId: driverId,
        });

        // ==========================================
        // SUCCESS
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });

    } catch (error) {
        console.error(
            "Reset Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    resetPassword,
};