const mongoose = require("mongoose");

const driverReportSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        ride: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ride",
            required: true,
        },

        passenger: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        issueCategory: {
            type: String,
            required: true,
            enum: [
                "Passenger No-Show",
                "Payment Issue",
                "Route/Navigation Problem",
                "Passenger Behavior",
                "Other",
            ],
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        photo: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "In Review",
                "Resolved",
                "Rejected",
            ],
            default: "Pending",
        },

        // Who created the report
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        // Who last updated the report
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "DriverReport",
    driverReportSchema
);