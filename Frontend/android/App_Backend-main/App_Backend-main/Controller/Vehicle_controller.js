const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
const Driver = require("../Schema/Driver");
const cloudinary = require("../config/cloudinary");

// ==========================================
// UPLOAD IMAGE TO CLOUDINARY
// ==========================================

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
};

// ==========================================
// DELETE IMAGE FROM CLOUDINARY
// ==========================================

const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) {
      return resolve();
    }

    cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error(
            `Failed to delete Cloudinary image: ${publicId}`,
            error
          );

          return reject(error);
        }

        resolve(result);
      }
    );
  });
};

// ==========================================
// 1. CREATE VEHICLE
// ==========================================

const createVehicle = async (req, res) => {
  const uploadedFiles = [];

  try {
    // ==========================================
    // GET DRIVER ID FROM JWT
    // ==========================================

    const driverId = req.user?.id;

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid driver token.",
      });
    }

    // ==========================================
    // CHECK DRIVER
    // ==========================================

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver account not found.",
      });
    }

    // ==========================================
    // GET VEHICLE DATA
    // ==========================================

    const {
      vehicleMake,
      vehicleModel,
      variant,
      numberOfSeats,
      registrationNumber,
      vehicleColor,
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (
      !vehicleMake ||
      !vehicleModel ||
      !variant ||
      !numberOfSeats ||
      !registrationNumber ||
      !vehicleColor
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required vehicle information.",
      });
    }

    // ==========================================
    // CHECK DRIVER ALREADY HAS VEHICLE
    // ==========================================

    const driverVehicle = await Vehicle.findOne({
      driver: driverId,
    });

    if (driverVehicle) {
      return res.status(409).json({
        success: false,
        message:
          "This driver already has a registered vehicle.",
      });
    }

    // ==========================================
    // CLEAN REGISTRATION NUMBER
    // ==========================================

    const cleanRegistrationNumber =
      String(registrationNumber).trim();

    // ==========================================
    // CHECK DUPLICATE REGISTRATION NUMBER
    // ==========================================

    const existingVehicle = await Vehicle.findOne({
      registrationNumber:
        cleanRegistrationNumber,
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle with this registration number already exists.",
      });
    }

    // ==========================================
    // GET FILES
    //
    // 1. registrationBook
    // 2. frontView
    // ==========================================

    const files = req.files || {};

    const registrationBook =
      files.registrationBook?.[0];

    const frontView =
      files.frontView?.[0];

    // ==========================================
    // REQUIRED FILE VALIDATION
    // ==========================================

    if (!registrationBook) {
      return res.status(400).json({
        success: false,
        message:
          "Registration book image is required.",
      });
    }

    if (!frontView) {
      return res.status(400).json({
        success: false,
        message:
          "Front vehicle image is required.",
      });
    }

    // ==========================================
    // ALLOWED IMAGE TYPES
    // ==========================================

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    // ==========================================
    // REGISTRATION BOOK IMAGE VALIDATION
    // ==========================================

    if (
      !allowedImageTypes.includes(
        registrationBook.mimetype
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration book must be JPG, JPEG or PNG image.",
      });
    }

    // ==========================================
    // FRONT VIEW IMAGE VALIDATION
    // ==========================================

    if (
      !allowedImageTypes.includes(
        frontView.mimetype
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Front vehicle image must be JPG, JPEG or PNG image.",
      });
    }

    // ==========================================
    // UPLOAD REGISTRATION BOOK
    // ==========================================

    const registrationBookUpload =
      await uploadToCloudinary(
        registrationBook,
        "vehicles/registrationBooks"
      );

    uploadedFiles.push({
      publicId:
        registrationBookUpload.public_id,
    });

    // ==========================================
    // UPLOAD FRONT VIEW
    // ==========================================

    const frontViewUpload =
      await uploadToCloudinary(
        frontView,
        "vehicles/images"
      );

    uploadedFiles.push({
      publicId:
        frontViewUpload.public_id,
    });

    // ==========================================
    // CREATE VEHICLE
    // ==========================================

    const vehicle = await Vehicle.create({
      // ==========================================
      // DRIVER RELATION
      // ==========================================

      driver: driverId,

      // ==========================================
      // VEHICLE INFORMATION
      // ==========================================

      vehicleMake: vehicleMake.trim(),

      vehicleModel: vehicleModel.trim(),

      variant: variant.trim(),

      numberOfSeats: Number(numberOfSeats),

      registrationNumber:
        cleanRegistrationNumber,

      vehicleColor: vehicleColor.trim(),

      // ==========================================
      // REGISTRATION BOOK
      // ==========================================

      registrationBook: {
        url: registrationBookUpload.url,
        public_id:
          registrationBookUpload.public_id,
      },

      // ==========================================
      // VEHICLE FRONT IMAGE
      // ==========================================

      vehicleImages: {
        frontView: {
          url: frontViewUpload.url,
          public_id:
            frontViewUpload.public_id,
        },
      },

      // ==========================================
      // VERIFICATION STATUS
      // ==========================================

      verificationStatus: "Pending",

      // ==========================================
      // BACKEND CONTROLLED
      // ==========================================

      createdBy: driverId,
    });

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(201).json({
      success: true,
      message:
        "Vehicle registered successfully. Vehicle information has been submitted for admin approval.",
      vehicle,
    });

  } catch (error) {
    console.error(
      "Vehicle registration error:",
      error
    );

    // ==========================================
    // CLEAN CLOUDINARY IF DB SAVE FAILS
    // ==========================================

    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) =>
          deleteFromCloudinary(
            file.publicId
          )
        )
      );
    }

    // ==========================================
    // DUPLICATE KEY
    // ==========================================

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      return res.status(409).json({
        success: false,
        message:
          duplicateField === "driver"
            ? "This driver already has a vehicle."
            : "Vehicle with this registration number already exists.",
      });
    }

    // ==========================================
    // VALIDATION ERROR
    // ==========================================

    if (
      error.name ===
      "ValidationError"
    ) {
      const errors =
        Object.values(
          error.errors
        ).map(
          (err) => err.message
        );

      return res.status(400).json({
        success: false,
        message:
          "Vehicle validation failed.",
        errors,
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to register vehicle.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET MY VEHICLES
// ==========================================

const getVehicles = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(
        driverId
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const vehicles =
      await Vehicle.find({
        driver: driverId,
      }).populate(
        "driver",
        "Name PhoneNumber CountryCode CountryIso"
      );

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });

  } catch (error) {
    console.error(
      "Get vehicles error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get vehicles.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET MY VEHICLE BY ID
// ==========================================

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const driverId = req.user?.id;

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(
        driverId
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Vehicle ID format.",
      });
    }

    const vehicle =
      await Vehicle.findOne({
        _id: id,
        driver: driverId,
      }).populate(
        "driver",
        "Name PhoneNumber CountryCode CountryIso"
      );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      vehicle,
    });

  } catch (error) {
    console.error(
      "Get vehicle by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get vehicle.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. DELETE MY VEHICLE
// ==========================================

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const driverId = req.user?.id;

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(
        driverId
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Vehicle ID format.",
      });
    }

    // ==========================================
    // FIND VEHICLE
    // ==========================================

    const vehicle =
      await Vehicle.findOne({
        _id: id,
        driver: driverId,
      });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found.",
      });
    }

    // ==========================================
    // COLLECT CLOUDINARY FILES
    // ==========================================

    const filesToDelete = [];

    // Registration Book
    if (
      vehicle.registrationBook?.public_id
    ) {
      filesToDelete.push(
        vehicle.registrationBook.public_id
      );
    }

    // Front View
    if (
      vehicle.vehicleImages?.frontView?.public_id
    ) {
      filesToDelete.push(
        vehicle.vehicleImages.frontView.public_id
      );
    }

    // ==========================================
    // DELETE CLOUDINARY FILES
    // ==========================================

    if (filesToDelete.length > 0) {
      await Promise.allSettled(
        filesToDelete.map((publicId) =>
          deleteFromCloudinary(
            publicId
          )
        )
      );
    }

    // ==========================================
    // DELETE VEHICLE
    // ==========================================

    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Vehicle and related images deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete vehicle error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete vehicle.",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  deleteVehicle,
};