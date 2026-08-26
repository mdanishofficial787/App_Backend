const bcrypt = require("bcryptjs");

const Driver = require("../Schema/Driver");

const PasswordResetRequest = require(
    "../Schema/Password"
);

// RESET DRIVER PASSWORD
const resetPassword = async (req, res) => {
    try {
        const {
            driverId,
            NewPassword,
            ConfirmPassword,
        } = req.body;

        // VALIDATION

        if (
            !driverId ||
            !NewPassword ||
            !ConfirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Driver ID, new password and confirm password are required",
            });
        }

        // CHECK PASSWORD MATCH

        if (NewPassword !== ConfirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password and confirm password do not match",
            });
        }

        // FIND LATEST PASSWORD RESET REQUEST

        const resetRequest =
            await PasswordResetRequest.findOne({
                driver: driverId,
            }).sort({
                createdAt: -1,
            });

        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                message:
                    "No password reset request found",
            });
        }

        // CHECK ADMIN APPROVAL

        if (resetRequest.status !== "Approved") {
            return res.status(403).json({
                success: false,
                message:
                    resetRequest.status === "Pending"
                        ? "Your password reset request is still pending admin approval"
                        : "Your password reset request was rejected by admin",
            });
        }

        // FIND DRIVER

        const driver = await Driver.findById(
            driverId
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver account not found",
            });
        }

        // HASH NEW PASSWORD

        const hashedPassword = await bcrypt.hash(
            NewPassword,
            10
        );

        // UPDATE PASSWORD

        driver.Password = hashedPassword;

        await driver.save();

        // Approved request ko dobara use nahi hona chahiye

        resetRequest.status = "Used";

        await resetRequest.save();

        // SUCCESS

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