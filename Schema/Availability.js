const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
    {
        startTime: {
            type: String,
            required: true,
            match: /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/
        },
        endTime: {
            type: String,
            default: null,
            match: /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/
        },
        flexibleAfterDropoff: {
            type: Boolean,
            default: false
        }
    },
    {
        _id: true
    }
);

const dayAvailabilitySchema = new mongoose.Schema(
    {
        day: {
            type: String,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            required: true
        },
        timeSlots: {
            type: [timeSlotSchema],
            default: []
        }
    },
    {
        _id: false
    }
);

const availabilitySchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            unique: true
        },
        repeatSchedule: {
            type: String,
            enum: ["same", "different"],
            required: true
        },
        selectedDays: {
            type: [
                {
                    type: String,
                    enum: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday"
                    ]
                }
            ],
            default: []
        },
        timeSlots: {
            type: [timeSlotSchema],
            default: []
        },
        dayAvailability: {
            type: [dayAvailabilitySchema],
            default: []
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Availability", availabilitySchema);