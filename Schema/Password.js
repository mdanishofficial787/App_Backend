const mongoose = require("mongoose");

// ==========================================
// PASSWORD RESET REQUEST SCHEMA
// ==========================================

const passwordResetRequestSchema = new mongoose.Schema(
    {
        // ==========================================
        // DRIVER
        // ==========================================

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        // ==========================================
        // REQUEST STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Used",
            ],
            default: "Pending",
        },

        // ==========================================
        // REQUESTED AT
        // ==========================================

        requestedAt: {
            type: Date,
            default: Date.now,
        },

        // ==========================================
        // APPROVED AT
        // ==========================================

        approvedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // REJECTED AT
        // ==========================================

        rejectedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // CREATED BY
        // Driver who created request
        // ==========================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        // ==========================================
        // UPDATED BY
        // Admin who approves/rejects request
        // ==========================================

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// EXPORT MODEL SAFELY
// Prevent OverwriteModelError
// ==========================================

const PasswordResetRequest =
    mongoose.models.PasswordResetRequest ||
    mongoose.model(
        "PasswordResetRequest",
        passwordResetRequestSchema
    );

module.exports = PasswordResetRequest;