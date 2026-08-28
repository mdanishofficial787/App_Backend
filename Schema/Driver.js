const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    // ==========================================
    // DRIVER BASIC INFORMATION
    // ==========================================

    Name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    driverReferenceId: {
      type: String,
      unique: true,
      index: true,
    },

    PhoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    CountryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
    },

    CountryIso: {
      type: String,
      required: [true, "Country ISO is required"],
      trim: true,
      uppercase: true,
      default: "PK",
    },

    Email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },

    // ==========================================
    // CNIC
    // ==========================================

    CnicNumber: {
      type: String,
      required: [true, "CNIC number is required"],
      unique: true,
      trim: true,
    },

    CnicFront: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },

    CnicBack: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },

    // LICENSE
    License: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },

    LicenseExpiryDate: {
      type: Date,
      required: [true, "License expiry date is required"],
    },

    LicenseFront: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },

    LicenseBack: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    // PASSWORD
    Password: {
      type: String,
      required: [true, "Password is required"],
    },
    // DRIVER PHOTO
    driverPhoto: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    // BACKGROUND CHECK
    backgroundCheckConsent: {
      type: Boolean,
      default: false,
    },

    // VERIFICATION STATUS
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    // ACCOUNT STATUS
    accountStatus: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    // EXPIRY / UPDATE INFORMATION
    updateRequired: {
      type: Boolean,
      default: false,
    },
    expiryWarning: {
      type: String,
      default: null,
    },

    // DRIVER UPDATE REQUEST
    updateRequestStatus: {
      type: String,
      enum: ["None", "Pending", "Approved", "Rejected"],
      default: "None",
    },
    pendingUpdate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // REMEMBER ME
    rememberMe: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Driver", driverSchema);