const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    pickupLocation: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    dropoffLocation: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "accepted", "rejected", "started", "completed", "cancelled"],
      default: "pending",
    },
    fare: {
      type: Number,
      default: 0
    },
    rideType: {
      type: String,
      default: "standard"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);
