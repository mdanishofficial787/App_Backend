const mongoose = require("mongoose");

const preferredRouteSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        startLocation: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
        },

        endLocation: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
        },

        preferredTime: {
            type: String,
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PreferredRoute", preferredRouteSchema);