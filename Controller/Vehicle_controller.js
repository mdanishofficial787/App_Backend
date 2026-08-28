const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
const Driver = require("../Schema/Driver");
const cloudinary = require("../config/cloudinary");

// ==========================================
// CLOUDINARY HELPERS
// ==========================================

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
};

const deleteFromCloudinary = (publicId) => {
  if (!publicId) return Promise.resolve();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

// ==========================================
// COMMON HELPERS
// ==========================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getDriverId = (req) => req.user?.id;

const getVehicleFiles = (req) => {
  const files = req.files || {};

  return {
    registrationBookFront:
      files.registrationBookFront?.[0],

    registrationBookBack:
      files.registrationBookBack?.[0],

    frontView:
      files.frontView?.[0],
  };
};

const cleanupCloudinaryFiles = async (files) => {
  if (!files.length) return;

  await Promise.allSettled(
    files.map((publicId) =>
      deleteFromCloudinary(publicId)
    )
  );
};

// ==========================================
// 1. CREATE VEHICLE
// ==========================================

const createVehicle = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const driverId = getDriverId(req);

    // AUTH CHECK
    if (
      !driverId ||
      !isValidObjectId(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid driver token.",
      });
    }

    // CHECK DRIVER
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver account not found.",
      });
    }

    // ==========================================
    // VEHICLE DATA
    // ==========================================

    const {
      vehicleMake,
      vehicleModel,
      variant,
      numberOfSeats,
      registrationNumber,
      vehicleColor,
    } = req.body;

    // REQUIRED TEXT FIELDS
    const requiredFields = {
      vehicleMake,
      vehicleModel,
      variant,
      registrationNumber,
      vehicleColor,
    };

    const missingFields = Object.keys(
      requiredFields
    ).filter(
      (field) =>
        !requiredFields[field] ||
        String(requiredFields[field]).trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required vehicle fields.",
        missingFields,
      });
    }

    // SEATS VALIDATION
    const seats = Number(numberOfSeats);

    if (
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Number of seats must be a valid positive number.",
      });
    }

    // ==========================================
    // CLEAN DATA
    // ==========================================

    const cleanVehicleMake =
      String(vehicleMake).trim();

    const cleanVehicleModel =
      String(vehicleModel).trim();

    const cleanVariant =
      String(variant).trim();

    const cleanRegistrationNumber =
      String(registrationNumber)
        .trim()
        .toUpperCase();

    const cleanVehicleColor =
      String(vehicleColor).trim();

    // ==========================================
    // CHECK DRIVER VEHICLE
    // ==========================================

    const existingDriverVehicle =
      await Vehicle.findOne({
        driver: driverId,
      });

    if (existingDriverVehicle) {
      return res.status(409).json({
        success: false,
        message:
          "This driver already has a registered vehicle.",
      });
    }

    // ==========================================
    // CHECK REGISTRATION NUMBER
    // ==========================================

    const existingRegistration =
      await Vehicle.findOne({
        registrationNumber:
          cleanRegistrationNumber,
      });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle with this registration number already exists.",
      });
    }

    // ==========================================
    // FILES
    // ==========================================

    const {
      registrationBookFront,
      registrationBookBack,
      frontView,
    } = getVehicleFiles(req);

    if (!registrationBookFront) {
      return res.status(400).json({
        success: false,
        message:
          "Registration book front image is required.",
      });
    }

    if (!registrationBookBack) {
      return res.status(400).json({
        success: false,
        message:
          "Registration book back image is required.",
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
    // FILE TYPE VALIDATION
    // ==========================================

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const filesToValidate = [
      {
        file: registrationBookFront,
        message:
          "Registration book front must be JPG, JPEG or PNG.",
      },
      {
        file: registrationBookBack,
        message:
          "Registration book back must be JPG, JPEG or PNG.",
      },
      {
        file: frontView,
        message:
          "Front vehicle image must be JPG, JPEG or PNG.",
      },
    ];

    for (const item of filesToValidate) {
      if (
        !allowedImageTypes.includes(
          item.file.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message: item.message,
        });
      }
    }

    // ==========================================
    // UPLOAD REGISTRATION BOOK FRONT
    // ==========================================

    const registrationFront =
      await uploadToCloudinary(
        registrationBookFront,
        "vehicles/registrationBooks"
      );

    uploadedPublicIds.push(
      registrationFront.public_id
    );

    // ==========================================
    // UPLOAD REGISTRATION BOOK BACK
    // ==========================================

    const registrationBack =
      await uploadToCloudinary(
        registrationBookBack,
        "vehicles/registrationBooks"
      );

    uploadedPublicIds.push(
      registrationBack.public_id
    );

    // ==========================================
    // UPLOAD VEHICLE FRONT
    // ==========================================

    const vehicleFront =
      await uploadToCloudinary(
        frontView,
        "vehicles/images"
      );

    uploadedPublicIds.push(
      vehicleFront.public_id
    );

    // ==========================================
    // CREATE VEHICLE
    // ==========================================

    const vehicle = await Vehicle.create({
      driver: driverId,

      vehicleMake:
        cleanVehicleMake,

      vehicleModel:
        cleanVehicleModel,

      variant:
        cleanVariant,

      numberOfSeats:
        seats,

      registrationNumber:
        cleanRegistrationNumber,

      vehicleColor:
        cleanVehicleColor,

      registrationBook: {
        front: {
          url: registrationFront.url,
          public_id:
            registrationFront.public_id,
        },

        back: {
          url: registrationBack.url,
          public_id:
            registrationBack.public_id,
        },
      },

      vehicleImages: {
        frontView: {
          url: vehicleFront.url,
          public_id:
            vehicleFront.public_id,
        },
      },

      createdBy: driverId,

      updatedBy: null,

      verificationStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Vehicle registered successfully. Vehicle information has been submitted for admin approval.",
      vehicle,
    });

  } catch (error) {
    console.error(
      "Create Vehicle Error:",
      error
    );

    // CLEAN UP UPLOADED FILES
    await cleanupCloudinaryFiles(
      uploadedPublicIds
    );

    // DUPLICATE KEY
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
            : duplicateField ===
              "registrationNumber"
              ? "Vehicle with this registration number already exists."
              : "Duplicate vehicle data.",
      });
    }

    // MONGOOSE VALIDATION
    if (
      error.name === "ValidationError"
    ) {
      const errors = Object.values(
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

    return res.status(500).json({
      success: false,
      message:
        "Failed to register vehicle. Please try again later.",
    });
  }
};

// ==========================================
// 2. GET MY VEHICLES
// ==========================================

const getVehicles = async (req, res) => {
  try {
    const driverId = getDriverId(req);

    if (
      !driverId ||
      !isValidObjectId(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const vehicles =
      await Vehicle.find({
        driver: driverId,
      })
        .populate(
          "driver",
          "Name PhoneNumber CountryCode CountryIso"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });

  } catch (error) {
    console.error(
      "Get Vehicles Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve vehicles. Please try again later.",
    });
  }
};

// ==========================================
// 3. GET MY VEHICLE BY ID
// ==========================================

const getVehicleById = async (req, res) => {
  try {
    const driverId = getDriverId(req);
    const { id } = req.params;

    if (
      !driverId ||
      !isValidObjectId(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid vehicle ID.",
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
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      vehicle,
    });

  } catch (error) {
    console.error(
      "Get Vehicle By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve vehicle. Please try again later.",
    });
  }
};

// ==========================================
// 4. DELETE MY VEHICLE
// ==========================================

const deleteVehicle = async (req, res) => {
  try {
    const driverId = getDriverId(req);
    const { id } = req.params;

    if (
      !driverId ||
      !isValidObjectId(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid vehicle ID.",
      });
    }

    // FIND ONLY DRIVER'S VEHICLE
    const vehicle =
      await Vehicle.findOne({
        _id: id,
        driver: driverId,
      });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    // ==========================================
    // COLLECT CLOUDINARY FILES
    // ==========================================

    const publicIds = [];

    if (
      vehicle.registrationBook?.front
        ?.public_id
    ) {
      publicIds.push(
        vehicle.registrationBook.front.public_id
      );
    }

    if (
      vehicle.registrationBook?.back
        ?.public_id
    ) {
      publicIds.push(
        vehicle.registrationBook.back.public_id
      );
    }

    if (
      vehicle.vehicleImages?.frontView
        ?.public_id
    ) {
      publicIds.push(
        vehicle.vehicleImages.frontView.public_id
      );
    }

    // ==========================================
    // DELETE DATABASE RECORD
    // ==========================================

    await Vehicle.deleteOne({
      _id: id,
      driver: driverId,
    });

    // ==========================================
    // DELETE CLOUDINARY FILES
    // ==========================================

    await cleanupCloudinaryFiles(
      publicIds
    );

    return res.status(200).json({
      success: true,
      message:
        "Vehicle and related images deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete Vehicle Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete vehicle. Please try again later.",
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