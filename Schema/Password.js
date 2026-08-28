const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Used"],
            required: true,
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "changedByModel",
            default: null,
        },
        changedByModel: {
            type: String,
            enum: ["Driver", "Admin"],
            default: null,
        },
        note: {
            type: String,
            default: null,
        },
    },
    {
        _id: false,
    }
);

const passwordResetRequestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Used"],
            default: "Pending",
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
        statusHistory: [
            statusHistorySchema,
        ],
    },
    {
        timestamps: true,
    }
);

const PasswordResetRequest =
    mongoose.models.PasswordResetRequest ||
    mongoose.model(
        "PasswordResetRequest",
        passwordResetRequestSchema
    );

module.exports = PasswordResetRequest;