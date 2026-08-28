const mongoose = require("mongoose");
const VehicleSchema = new mongoose.Schema(
  {
    // DRIVER REFERENCE
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
    },
    // VEHICLE INFORMATION
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
    // REGISTRATION BOOK
    registrationBook: {
      front: {
        url: {
          type: String,
          required: true,
        },

        public_id: {
          type: String,
          required: true,
        },
      },

      back: {
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
    // REGISTRATION BOOK EXPIRY DATE
    registrationBookExpiryDate: {
      type: Date,
      default: null,
    },
    // VEHICLE IMAGES
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
    // TRACKING
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
    // ADMIN VERIFICATION
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    // VEHICLE ACCOUNT STATUS
    accountStatus: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    // UPDATE REQUIRED
    updateRequired: {
      type: Boolean,
      default: false,
    },
    // EXPIRY WARNING
    expiryWarning: {
      type: String,
      default: null,
    },

    // ADMIN UPDATE REQUEST
    updateRequestStatus: {
      type: String,
      enum: ["None", "Pending", "Approved", "Rejected"],
      default: "None",
    },
  },
  // TIMESTAMPS
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", VehicleSchema);