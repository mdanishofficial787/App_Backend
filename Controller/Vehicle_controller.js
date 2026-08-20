const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
const Driver = require("../Schema/Driver");
const cloudinary = require("../config/cloudinary");

// ==========================================
// UPLOAD FILE TO CLOUDINARY
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
  const uploadedPublicIds = [];

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
        message: "Unauthorized: Invalid driver token",
      });
    }

    // ==========================================
    // CHECK DRIVER EXISTS
    // ==========================================
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver account not found",
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
        message: "Please provide all required vehicle information",
      });
    }

    // ==========================================
    // DUPLICATE REGISTRATION NUMBER
    // ==========================================
    const existingVehicle = await Vehicle.findOne({
      registrationNumber: registrationNumber.trim(),
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle with this registration number already exists",
      });
    }

    // ==========================================
    // GET FILES
    // ==========================================
    const files = req.files || {};

    const registrationBook = files.registrationBook?.[0];
    const frontView = files.frontView?.[0];

    // ==========================================
    // REQUIRED FILE VALIDATION
    // ==========================================
    if (!registrationBook) {
      return res.status(400).json({
        success: false,
        message: "Registration book image is required",
      });
    }

    if (!frontView) {
      return res.status(400).json({
        success: false,
        message: "Front vehicle image is required",
      });
    }

    // ==========================================
    // PNG VALIDATION FOR REGISTRATION BOOK
    // ==========================================
    if (registrationBook.mimetype !== "image/png") {
      return res.status(400).json({
        success: false,
        message: "Registration book must be a PNG image",
      });
    }

    // ==========================================
    // IMAGE VALIDATION FOR FRONT VIEW
    // ==========================================
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedImageTypes.includes(frontView.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Front vehicle image must be JPG, JPEG or PNG",
      });
    }

    // ==========================================
    // UPLOAD TO CLOUDINARY
    // ==========================================
    const [registrationBookUpload, frontViewUpload] =
      await Promise.all([
        uploadToCloudinary(
          registrationBook,
          "vehicles/registrationBooks"
        ),

        uploadToCloudinary(
          frontView,
          "vehicles/images"
        ),
      ]);

    // ==========================================
    // KEEP PUBLIC IDs FOR CLEANUP
    // ==========================================
    uploadedPublicIds.push(
      registrationBookUpload.public_id,
      frontViewUpload.public_id
    );

    // ==========================================
    // CREATE VEHICLE
    // ==========================================
    const vehicle = await Vehicle.create({
      // IMPORTANT:
      // Driver ID comes from JWT, NOT frontend
      driver: driverId,

      vehicleMake: vehicleMake.trim(),

      vehicleModel: vehicleModel.trim(),

      variant: variant.trim(),

      numberOfSeats,

      registrationNumber:
        registrationNumber.trim(),

      vehicleColor: vehicleColor.trim(),

      // ==========================================
      // REGISTRATION BOOK
      // ==========================================
      registrationBook: {
        url: registrationBookUpload.url,
        public_id: registrationBookUpload.public_id,
      },

      // ==========================================
      // VEHICLE IMAGES
      // ==========================================
      vehicleImages: {
        frontView: {
          url: frontViewUpload.url,
          public_id: frontViewUpload.public_id,
        },
      },

      // Backend automatically sets createdBy
      createdBy: driverId,
    });

    // ==========================================
    // SUCCESS
    // ==========================================
    return res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
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
    if (uploadedPublicIds.length > 0) {
      await Promise.allSettled(
        uploadedPublicIds.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle with this registration number already exists",
      });
    }

    // ==========================================
    // SERVER ERROR
    // ==========================================
    return res.status(500).json({
      success: false,
      message: "Failed to register vehicle",
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
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const vehicles = await Vehicle.find({
      driver: driverId,
    }).populate(
      "driver",
      "Name PhoneNumber"
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
      message: "Failed to get vehicles",
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

    // ==========================================
    // VALIDATE DRIVER
    // ==========================================
    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==========================================
    // VALIDATE VEHICLE ID
    // ==========================================
    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Vehicle ID format",
      });
    }

    // ==========================================
    // FIND ONLY THIS DRIVER'S VEHICLE
    // ==========================================
    const vehicle = await Vehicle.findOne({
      _id: id,
      driver: driverId,
    }).populate(
      "driver",
      "Name PhoneNumber"
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
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
      message: "Failed to get vehicle",
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

    // ==========================================
    // VALIDATE DRIVER
    // ==========================================
    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==========================================
    // VALIDATE VEHICLE ID
    // ==========================================
    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Vehicle ID format",
      });
    }

    // ==========================================
    // FIND ONLY THIS DRIVER'S VEHICLE
    // ==========================================
    const vehicle = await Vehicle.findOne({
      _id: id,
      driver: driverId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // ==========================================
    // CLOUDINARY FILES
    // ==========================================
    const publicIdsToDelete = [];

    if (
      vehicle.registrationBook?.public_id
    ) {
      publicIdsToDelete.push(
        vehicle.registrationBook.public_id
      );
    }

    if (
      vehicle.vehicleImages?.frontView?.public_id
    ) {
      publicIdsToDelete.push(
        vehicle.vehicleImages.frontView.public_id
      );
    }

    // ==========================================
    // DELETE CLOUDINARY FILES
    // ==========================================
    if (publicIdsToDelete.length > 0) {
      await Promise.allSettled(
        publicIdsToDelete.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    // ==========================================
    // DELETE VEHICLE FROM MONGODB
    // ==========================================
    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Vehicle and related media deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete vehicle error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
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