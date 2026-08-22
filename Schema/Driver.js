const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    driverReferenceId: {
      type: String,
      unique: true,
      // required: true,
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
      // default: "+92",
    },
    CountryIso: {
      type: String,
      required: [true, "Country ISO code is required"],
      trim: true,
      uppercase: true,
      default: "PK",
    },
    Email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true, // Allows null/unique without index conflicts
    },
    CnicNumber: {
      type: String,
      required: [true, "CNIC number is required"],
      unique: true,
      trim: true,
    },
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
    Password: {
      type: String,
      required: [true, "Password is required"],
    },
    driverPhoto: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    CnicFront: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    CnicBack: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    LicenseFront: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    LicenseBack: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    backgroundCheckConsent: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending"
    },

  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Driver", driverSchema);