const mongoose = require("mongoose");

const driverPreferenceSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true
        },

        preferredRoute: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Route",
            required: true
        },

        preferredTimeSlot: {
            type: String,
            required: false
        },

        startPoint: {
            address: {
                type: String,
                required: true
            },
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        },

        endPoint: {
            address: {
                type: String,
                required: true
            },
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "DriverPreference",
    driverPreferenceSchema
);