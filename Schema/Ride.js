const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
    {
        // UNIQUE RIDE ID
        rideId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        // CUSTOMER / PASSENGER
        passenger: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        // DRIVER

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null
        },


        // PASS TYPE
        passType: {
            type: String,
            required: true,
            trim: true
        },


        // PICKUP LOCATION
        pickupLocation: {
            address: {
                type: String,
                required: true,
                trim: true
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


        // DROP-OFF LOCATION
        dropoffLocation: {
            address: {
                type: String,
                required: true,
                trim: true
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


        // RIDE END TIME
        rideEndTime: {
            type: Date,
            required: true
        },


        // RIDE STATUS
        status: {
            type: String,
            enum: [
                "PENDING",
                "ASSIGNED",
                "APPROVED",
                "REJECTED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "PENDING"
        }
    },

    {
        timestamps: true
    }
);


module.exports = mongoose.model("Ride", rideSchema);