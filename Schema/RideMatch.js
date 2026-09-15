const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
    {
        routeName: { type: String, required: true }, // e.g. "Route A"
        pickupPoint: {
            address: { type: String, required: true },
            latitude: { type: Number },
            longitude: { type: Number }
        },
        dropPoint: {
            address: { type: String, required: true },
            latitude: { type: Number },
            longitude: { type: Number }
        },
        timeSlot: { type: String, required: true }, // e.g. "7:00 AM - 9:00 AM"
        activeRequestsCount: { type: Number, default: 0 } // Customer requests ka count
    },
    { timestamps: true }
);

module.exports = mongoose.model("Route", routeSchema);