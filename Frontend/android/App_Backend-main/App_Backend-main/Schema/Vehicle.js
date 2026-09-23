const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    // ==========================================
    // DRIVER REFERENCE
    // ==========================================

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
    },

    // ==========================================
    // VEHICLE INFORMATION
    // ==========================================

    vehicleMake: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
    },

    vehicleModel: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },

    variant: {
      type: String,
      required: [true, "Vehicle variant is required"],
      trim: true,
    },

    numberOfSeats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: [1, "Number of seats must be at least 1"],
    },

    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
      unique: true,
    },

    vehicleColor: {
      type: String,
      required: [true, "Vehicle color is required"],
      trim: true,
    },

    // ==========================================
    // REGISTRATION BOOK
    // PDF
    // ==========================================

    registrationBook: {
      url: {
        type: String,
        required: true,
      },

      public_id: {
        type: String,
        required: true,
      },
    },
    vehicleImages: {
      frontView: {
        url: {
          type: String,
          required: true,
        },

        public_id: {
          type: String,
          required: true,
        },
      },
    },

    // ==========================================
    // TRACKING
    // ==========================================

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
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },

  // ==========================================
  // TIMESTAMPS
  // ==========================================

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Vehicle",
  VehicleSchema
);