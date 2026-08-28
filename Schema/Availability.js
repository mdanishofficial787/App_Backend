const mongoose = require("mongoose");

// TIME SLOT SCHEMA
const timeSlotSchema = new mongoose.Schema(
    {
        startTime: {
            type: String,
            required: true,
        },

        endTime: {
            type: String,
            required: true,
        },

        untilNextTrip: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: true,
    }
);

// AVAILABILITY SCHEMA
const availabilitySchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        repeatSchedule: {
            type: String,
            enum: ["same", "different"],
            default: "same",
        },

        selectedDays: [
            {
                type: String,
                enum: [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                ],
            },
        ],

        timeSlots: [timeSlotSchema],

        flexibleAfterDropoff: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// CREATE MODEL
const Availability = mongoose.model(
    "Availability",
    availabilitySchema
);

// EXPORT MODEL
module.exports = Availability;