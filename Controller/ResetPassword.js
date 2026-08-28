
const bcrypt = require("bcryptjs");
const Driver = require("../Schema/Driver");
const PasswordResetRequest = require("../Schema/Password");

const resetPassword = async (req, res) => {
    try {
        const {
            driverId,
            requestId,
            NewPassword,
            ConfirmPassword,
        } = req.body;

        // 1. CHECK REQUIRED FIELDS
        if (
            !driverId ||
            !requestId ||
            !NewPassword ||
            !ConfirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Driver ID, request ID, new password and confirm password are required",
            });
        }

        // 2. CHECK PASSWORD MATCH
        if (NewPassword !== ConfirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password and confirm password do not match",
            });
        }

        // 3. FIND RESET REQUEST
        const resetRequest =
            await PasswordResetRequest.findOne({
                requestId: requestId,
                driver: driverId,
            });

        if (!resetRequest) {
            return res.status(404).json({
                success: false,
                message:
                    "Password reset request not found",
            });
        }

        // 4. CHECK STATUS
        if (resetRequest.status === "Pending") {
            return res.status(403).json({
                success: false,
                message:
                    "Your password reset request is still pending admin approval",
            });
        }

        if (resetRequest.status === "Rejected") {
            return res.status(403).json({
                success: false,
                message:
                    "Your password reset request was rejected by admin",
            });
        }

        if (resetRequest.status === "Used") {
            return res.status(403).json({
                success: false,
                message:
                    "This password reset request has already been used",
            });
        }

        if (resetRequest.status !== "Approved") {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to reset your password",
            });
        }

        // 5. CHECK APPROVAL TIME
        if (!resetRequest.approvedAt) {
            return res.status(403).json({
                success: false,
                message:
                    "Password reset approval time not found",
            });
        }

        // 6. 15 MINUTES CHECK
        const approvedTime =
            new Date(resetRequest.approvedAt).getTime();

        const currentTime =
            new Date().getTime();

        const fifteenMinutes =
            15 * 60 * 1000;

        if (
            currentTime - approvedTime >=
            fifteenMinutes
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Password reset request has expired. Please send a new request.",
            });
        }

        // 7. FIND DRIVER
        const driver =
            await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message:
                    "Driver account not found",
            });
        }

        // 8. HASH NEW PASSWORD
        const hashedPassword =
            await bcrypt.hash(
                NewPassword,
                10
            );

        // 9. UPDATE PASSWORD
        driver.Password =
            hashedPassword;

        await driver.save();

        // 10. MARK REQUEST AS USED
        resetRequest.status = "Used";
        resetRequest.usedAt = new Date();

        resetRequest.statusHistory.push({
            status: "Used",
            changedAt: new Date(),
            changedBy: driver._id,
            changedByModel: "Driver",
            note:
                "Password reset successfully completed",
        });

        await resetRequest.save();

        // 11. SUCCESS RESPONSE
        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully",
            data: {
                requestId:
                    resetRequest.requestId,
                status:
                    resetRequest.status,
                usedAt:
                    resetRequest.usedAt,
            },
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

