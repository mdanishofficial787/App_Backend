const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
const cloudinary = require("../config/cloudinary");

// ==========================================
// CLOUDINARY UPLOAD
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

// ==========================================
// CLOUDINARY DELETE
// ==========================================

const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) return resolve();

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
// UPDATE VEHICLE
// ==========================================

const updateVehicle = async (req, res) => {
  const newUploadedFiles = [];
  const oldFilesToDelete = [];

  try {
    // ==========================================
    // 1. DRIVER ID FROM TOKEN
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
    // 2. VEHICLE ID
    // ==========================================

    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    // ==========================================
    // 3. FIND DRIVER'S VEHICLE
    // ==========================================

    const vehicle = await Vehicle.findOne({
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
    // 4. PROTECTED FIELDS
    // ==========================================

    delete req.body._id;
    delete req.body.driver;
    delete req.body.createdBy;
    delete req.body.updatedBy;
    delete req.body.verificationStatus;

    // ==========================================
    // 5. TEXT FIELDS
    // ==========================================

    const textFields = [
      "vehicleMake",
      "vehicleModel",
      "variant",
      "vehicleColor",
    ];

    textFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = String(req.body[field]).trim();

        if (!value) {
          throw new Error(`${field} cannot be empty.`);
        }

        vehicle[field] = value;
      }
    });

    // ==========================================
    // 6. NUMBER OF SEATS
    // ==========================================

    if (req.body.numberOfSeats !== undefined) {
      const seats = Number(req.body.numberOfSeats);

      if (!Number.isInteger(seats) || seats < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Number of seats must be a valid number greater than 0.",
        });
      }

      vehicle.numberOfSeats = seats;
    }

    // ==========================================
    // 7. REGISTRATION NUMBER
    // ==========================================

    if (req.body.registrationNumber !== undefined) {
      const registrationNumber = String(
        req.body.registrationNumber
      )
        .trim()
        .toUpperCase();

      if (!registrationNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Registration number cannot be empty.",
        });
      }

      const existingVehicle = await Vehicle.findOne({
        registrationNumber,
        _id: { $ne: id },
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message:
            "Registration number already belongs to another vehicle.",
        });
      }

      vehicle.registrationNumber = registrationNumber;
    }

    // ==========================================
    // 8. GET FILES
    // ==========================================

    const files = req.files || {};

    const registrationBookFront =
      files.registrationBookFront?.[0];

    const registrationBookBack =
      files.registrationBookBack?.[0];

    const frontView =
      files.frontView?.[0];

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    // ==========================================
    // 9. UPDATE REGISTRATION BOOK FRONT
    // ==========================================

    if (registrationBookFront) {
      if (
        !allowedImageTypes.includes(
          registrationBookFront.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Registration book front must be JPG, JPEG or PNG.",
        });
      }

      if (
        vehicle.registrationBook?.front?.public_id
      ) {
        oldFilesToDelete.push(
          vehicle.registrationBook.front.public_id
        );
      }

      const uploaded = await uploadToCloudinary(
        registrationBookFront,
        "vehicles/registrationBooks"
      );

      newUploadedFiles.push(uploaded.public_id);

      vehicle.registrationBook.front = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // ==========================================
    // 10. UPDATE REGISTRATION BOOK BACK
    // ==========================================

    if (registrationBookBack) {
      if (
        !allowedImageTypes.includes(
          registrationBookBack.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Registration book back must be JPG, JPEG or PNG.",
        });
      }

      if (
        vehicle.registrationBook?.back?.public_id
      ) {
        oldFilesToDelete.push(
          vehicle.registrationBook.back.public_id
        );
      }

      const uploaded = await uploadToCloudinary(
        registrationBookBack,
        "vehicles/registrationBooks"
      );

      newUploadedFiles.push(uploaded.public_id);

      vehicle.registrationBook.back = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // ==========================================
    // 11. UPDATE VEHICLE FRONT IMAGE
    // ==========================================

    if (frontView) {
      if (
        !allowedImageTypes.includes(
          frontView.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle front image must be JPG, JPEG or PNG.",
        });
      }

      if (
        vehicle.vehicleImages?.frontView?.public_id
      ) {
        oldFilesToDelete.push(
          vehicle.vehicleImages.frontView.public_id
        );
      }

      const uploaded = await uploadToCloudinary(
        frontView,
        "vehicles/images"
      );

      newUploadedFiles.push(uploaded.public_id);

      vehicle.vehicleImages.frontView = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // ==========================================
    // 12. TRACK UPDATED BY
    // ==========================================

    vehicle.updatedBy = driverId;

    // ==========================================
    // 13. RESET VERIFICATION
    // ==========================================

    vehicle.verificationStatus = "Pending";

    // ==========================================
    // 14. SAVE TO MONGODB
    // ==========================================

    const updatedVehicle = await vehicle.save();

    // ==========================================
    // 15. DELETE OLD CLOUDINARY FILES
    // ==========================================

    if (oldFilesToDelete.length > 0) {
      await Promise.allSettled(
        oldFilesToDelete.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    // ==========================================
    // 16. RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Vehicle updated successfully. Changes have been submitted for admin verification.",
      vehicle: updatedVehicle,
    });

  } catch (error) {
    console.error("Update Vehicle Error:", error);

    // ==========================================
    // CLEAN NEW CLOUDINARY FILES
    // ==========================================

    if (newUploadedFiles.length > 0) {
      await Promise.allSettled(
        newUploadedFiles.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    // ==========================================
    // DUPLICATE KEY
    // ==========================================

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          duplicateField === "registrationNumber"
            ? "Registration number already exists."
            : "Vehicle already exists.",
      });
    }

    // ==========================================
    // MONGOOSE VALIDATION
    // ==========================================

    if (error.name === "ValidationError") {
      const errors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: "Vehicle validation failed.",
        errors,
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Unable to update vehicle. Please try again later.",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  updateVehicle,
};