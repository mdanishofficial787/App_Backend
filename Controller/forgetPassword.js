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

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // ==========================================
        // CLEAN EMAIL
        // ==========================================

        const cleanEmail = Email.toLowerCase().trim();

        // ==========================================
        // FIND DRIVER
        // ==========================================

        const driver = await Driver.findOne({
            Email: cleanEmail,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No driver account found with this email",
            });
        }

        // ==========================================
        // DELETE PREVIOUS UNVERIFIED OTP
        // ==========================================

        await Otp.deleteMany({
            driverId: driver._id,
            verified: false,
        });

        // ==========================================
        // GENERATE OTP
        // ==========================================

        const otp = generateOTP();

        // ==========================================
        // HASH OTP
        // ==========================================

        const hashedOTP = await bcrypt.hash(otp, 10);

        // ==========================================
        // OTP VALID FOR 2 MINUTES
        // ==========================================

        const otpExpiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        // ==========================================
        // SAVE OTP
        // ==========================================

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

        // ==========================================
        // SEND OTP EMAIL
        // ==========================================

        await sendEmail({
            to: cleanEmail,
            subject: "Ride & Serve - Forgot Password OTP",
            text: `Your Ride & Serve OTP is ${otp}. This OTP is valid for 2 minutes. If you did not request this OTP, please ignore this email.`,
            html: `
                <div>
                    <h2>Ride & Serve</h2>

                    <p>Your OTP for password reset is:</p>

                    <h1>${otp}</h1>

                    <p>
                        This OTP is valid for 2 minutes.
                    </p>

                    <p>
                        If you did not request this OTP,
                        please ignore this email.
                    </p>
                </div>
            `,
        });

        // ==========================================
        // SUCCESS
        // ==========================================

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
        const {
            Email,
            Otp: enteredOTP,
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!Email || !enteredOTP) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        // ==========================================
        // CLEAN EMAIL
        // ==========================================

        const cleanEmail = Email.toLowerCase().trim();

        // ==========================================
        // GET LATEST UNVERIFIED OTP
        // ==========================================

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

        // ==========================================
        // CHECK EXPIRY
        // ==========================================

        if (
            !otpRecord.otpExpiresAt ||
            otpRecord.otpExpiresAt < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // ==========================================
        // MAXIMUM ATTEMPTS
        // ==========================================

        if (otpRecord.otpAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        // ==========================================
        // COMPARE OTP
        // ==========================================

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

        // ==========================================
        // MARK OTP VERIFIED
        // ==========================================

        otpRecord.verified = true;

        await otpRecord.save();

        // ==========================================
        // SUCCESS
        // ==========================================

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

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // ==========================================
        // CLEAN EMAIL
        // ==========================================

        const cleanEmail = Email.toLowerCase().trim();

        // ==========================================
        // FIND DRIVER
        // ==========================================

        const driver = await Driver.findOne({
            Email: cleanEmail,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No driver account found with this email",
            });
        }

        // ==========================================
        // FIND LATEST OTP
        // ==========================================

        const previousOTP = await Otp.findOne({
            driverId: driver._id,
            Email: cleanEmail,
        }).sort({
            createdAt: -1,
        });

        // ==========================================
        // 30 SECONDS RESEND COOLDOWN
        // ==========================================

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

        // ==========================================
        // MAXIMUM 3 RESENDS
        // ==========================================

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

        // ==========================================
        // PRESERVE RESEND COUNT
        // ==========================================

        const newResendCount =
            (previousOTP?.resendCount || 0) + 1;

        // ==========================================
        // DELETE OLD OTP
        // ==========================================

        await Otp.deleteMany({
            driverId: driver._id,
        });

        // ==========================================
        // GENERATE NEW OTP
        // ==========================================

        const otp = generateOTP();

        // ==========================================
        // HASH NEW OTP
        // ==========================================

        const hashedOTP = await bcrypt.hash(
            otp,
            10
        );

        // ==========================================
        // NEW OTP VALID FOR 2 MINUTES
        // ==========================================

        const otpExpiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        // ==========================================
        // SAVE NEW OTP
        // ==========================================

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

        // ==========================================
        // SEND NEW OTP EMAIL
        // ==========================================

        await sendEmail({
            to: cleanEmail,
            subject: "Ride & Serve - New Password Reset OTP",
            text: `Your new Ride & Serve OTP is ${otp}. This OTP is valid for 2 minutes. If you did not request this OTP, please ignore this email.`,
            html: `
                <div>
                    <h2>Ride & Serve</h2>

                    <p>Your new OTP for password reset is:</p>

                    <h1>${otp}</h1>

                    <p>
                        This OTP is valid for 2 minutes.
                    </p>

                    <p>
                        If you did not request this OTP,
                        please ignore this email.
                    </p>
                </div>
            `,
        });

        // ==========================================
        // SUCCESS
        // ==========================================

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

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resendForgotPasswordOTP,
};