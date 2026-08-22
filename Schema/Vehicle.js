const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    // driver: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Driver",
    //   required: true,
    // },

    vehicleMake: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },

    variant: {
      type: String,
      required: true,
      trim: true,
    },

    numberOfSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    vehicleColor: {
      type: String,
      required: true,
      trim: true,
    },

    // Registration Book
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

    // Vehicle Images
    vehicleImages: {
      frontView: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    },

    // Trackers
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

module.exports = mongoose.model("Vehicle", VehicleSchema);