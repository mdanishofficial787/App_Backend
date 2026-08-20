const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const Driver = require("../Schema/Driver");
const Otp = require("../Schema/OTP.JS");
const sendEmail = require("../utils/sendemail");

// ==========================================
// GENERATE 6 DIGIT OTP
// ==========================================
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// ==========================================
// SEND FORGOT PASSWORD OTP
// ==========================================
const sendForgotPasswordOTP = async (req, res) => {
    try {
        const { Email } = req.body;

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const cleanEmail = Email.toLowerCase().trim();

        // Find driver
        const driver = await Driver.findOne({
            Email: cleanEmail,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No driver account found with this email",
            });
        }

        // Delete previous unverified OTP
        await Otp.deleteMany({
            driverId: driver._id,
            verified: false,
        });

        // Generate OTP
        const otp = generateOTP();

        // Hash OTP
        const hashedOTP = await bcrypt.hash(otp, 10);

        // OTP valid for 2 minutes
        const otpExpiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        // Save OTP
        await Otp.create({
            driverId: driver._id,
            Email: cleanEmail,
            Otp: hashedOTP,
            otpExpiresAt,
            verified: false,
            otpAttempts: 0,
            resendCount: 0,
            lastResendAt: null,
        });

        // Send OTP Email
        await sendEmail({
            to: cleanEmail,
            otp: otp,
            type: "forgot-password",
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to your registered email",
        });

    } catch (error) {
        console.error(
            "Send Forgot Password OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================================
// VERIFY FORGOT PASSWORD OTP
// ==========================================
const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { Email, Otp: enteredOTP } = req.body;

        if (!Email || !enteredOTP) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const cleanEmail = Email.toLowerCase().trim();

        // Get latest unverified OTP
        const otpRecord = await Otp.findOne({
            Email: cleanEmail,
            verified: false,
        }).sort({
            createdAt: -1,
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found",
            });
        }

        // Check expiry
        if (
            !otpRecord.otpExpiresAt ||
            otpRecord.otpExpiresAt < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // Maximum attempts
        if (otpRecord.otpAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        // Compare OTP
        const isValid = await bcrypt.compare(
            enteredOTP.toString(),
            otpRecord.Otp
        );

        if (!isValid) {
            otpRecord.otpAttempts += 1;

            await otpRecord.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Mark verified
        otpRecord.verified = true;

        await otpRecord.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            driverId: otpRecord.driverId,
        });

    } catch (error) {
        console.error(
            "Verify Forgot Password OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================================
// RESEND FORGOT PASSWORD OTP
// ==========================================
const resendForgotPasswordOTP = async (req, res) => {
    try {
        const { Email } = req.body;

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }
        const cleanEmail = Email.toLowerCase().trim();
        // Find driver
        const driver = await Driver.findOne({
            Email: cleanEmail,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No driver account found with this email",
            });
        }

        // Find latest OTP
        const previousOTP = await Otp.findOne({
            driverId: driver._id,
            Email: cleanEmail,
        }).sort({
            createdAt: -1,
        });

        // 30 seconds resend cooldown
        if (previousOTP?.lastResendAt) {
            const secondsPassed =
                (Date.now() -
                    previousOTP.lastResendAt.getTime()) /
                1000;

            if (secondsPassed < 30) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(
                        30 - secondsPassed
                    )} seconds before requesting another OTP`,
                });
            }
        }

        // Maximum 3 resends
        if (
            previousOTP &&
            previousOTP.resendCount >= 3
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "Maximum resend limit reached. Please try again later.",
            });
        }

        // Preserve resend count
        const newResendCount =
            (previousOTP?.resendCount || 0) + 1;

        // Delete old OTP
        await Otp.deleteMany({
            driverId: driver._id,
        });

        // Generate new OTP
        const otp = generateOTP();

        // Hash OTP
        const hashedOTP = await bcrypt.hash(
            otp,
            10
        );

        // New OTP valid for 2 minutes
        const otpExpiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        // Save new OTP
        await Otp.create({
            driverId: driver._id,
            Email: cleanEmail,
            Otp: hashedOTP,
            otpExpiresAt,
            verified: false,
            otpAttempts: 0,
            resendCount: newResendCount,
            lastResendAt: new Date(),
        });

        // Send new OTP Email
        await sendEmail({
            to: cleanEmail,
            otp: otp,
            type: "forgot-password",
        });

        return res.status(200).json({
            success: true,
            message:
                "New OTP sent successfully to your registered email",
        });

    } catch (error) {
        console.error(
            "Resend OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// EXPORTS
module.exports = {
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resendForgotPasswordOTP,
};