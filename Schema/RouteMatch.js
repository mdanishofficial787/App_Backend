const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
    {
        routeName: {
            type: String,
            required: true,
            trim: true
        },

        pickupPoint: {
            address: {
                type: String,
                required: true,
                trim: true
            },
            latitude: {
                type: Number
            },
            longitude: {
                type: Number
            }
        },

        dropPoint: {
            address: {
                type: String,
                required: true,
                trim: true
            },
            latitude: {
                type: Number
            },
            longitude: {
                type: Number
            }
        },

        // Optional
        startTime: {
            type: String,
            required: false
        },

        // Optional
        endTime: {
            type: String,
            required: false
        },

        // Customer requests count
        activeRequestsCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Route", routeSchema);