const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        // ==========================================
        // DRIVER
        // ==========================================
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            index: true,
        },

        // ==========================================
        // EMAIL
        // ==========================================
        Email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        // ==========================================
        // HASHED OTP
        // ==========================================
        Otp: {
            type: String,
            required: true,
        },

        // ==========================================
        // OTP EXPIRY
        // ==========================================
        otpExpiresAt: {
            type: Date,
            required: true,
        },

        // ==========================================
        // VERIFICATION STATUS
        // ==========================================
        verified: {
            type: Boolean,
            default: false,
        },

        // ==========================================
        // OTP ATTEMPTS
        // ==========================================
        otpAttempts: {
            type: Number,
            default: 0,
        },

        // ==========================================
        // RESEND COUNT
        // ==========================================
        resendCount: {
            type: Number,
            default: 0,
        },

        // ==========================================
        // LAST RESEND TIME
        // ==========================================
        lastResendAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// MONGODB TTL
// Record automatically delete after 2 minutes
// from createdAt
// ==========================================
otpSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 120 }
);

module.exports = mongoose.model(
    "Otp",
    otpSchema
);