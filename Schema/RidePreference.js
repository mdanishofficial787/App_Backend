const mongoose = require("mongoose");

const ridePreferenceSchema = new mongoose.Schema(
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
                trim: true,
                default: null,
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
                trim: true,
                default: null,
            },
        },


        preferredTime: {
            type: String,
            required: true,
            trim: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("RidePreference", ridePreferenceSchema);