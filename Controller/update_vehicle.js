const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
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
// UPDATE VEHICLE
// DRIVER CAN UPDATE VEHICLE INFORMATION
// DRIVER CANNOT CHANGE verificationStatus
// ==========================================

const updateVehicle = async (req, res) => {
  const newUploadedPublicIds = [];
  const oldPublicIdsToDelete = [];

  try {
    // ==========================================
    // 1. GET DRIVER ID FROM JWT
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
    // 2. GET VEHICLE ID
    // ==========================================

    const { id } = req.params;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Vehicle ID format.",
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
    // 4. PROTECTED BACKEND FIELDS
    // ==========================================

    // Driver cannot change these fields manually

    delete req.body.driver;
    delete req.body.createdBy;
    delete req.body.updatedBy;

    // IMPORTANT:
    // Driver cannot verify/reject vehicle himself

    delete req.body.verificationStatus;

    // ==========================================
    // 5. UPDATE REGISTRATION NUMBER
    // ==========================================

    if (
      req.body.registrationNumber !== undefined
    ) {
      const formattedRegNum = String(
        req.body.registrationNumber
      )
        .trim()
        .toUpperCase();

      if (!formattedRegNum) {
        return res.status(400).json({
          success: false,
          message:
            "Registration number cannot be empty.",
        });
      }

      const existingVehicle =
        await Vehicle.findOne({
          registrationNumber: formattedRegNum,
          _id: { $ne: id },
        });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message:
            "Registration number already belongs to another vehicle.",
        });
      }

      vehicle.registrationNumber =
        formattedRegNum;
    }

    // ==========================================
    // 6. UPDATE TEXT FIELDS
    // ==========================================

    const textFields = [
      "vehicleMake",
      "vehicleModel",
      "variant",
      "numberOfSeats",
      "vehicleColor",
    ];

    textFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    // ==========================================
    // 7. NUMBER OF SEATS VALIDATION
    // ==========================================

    if (req.body.numberOfSeats !== undefined) {
      const seats = Number(
        req.body.numberOfSeats
      );

      if (
        !Number.isInteger(seats) ||
        seats < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Number of seats must be a valid number greater than 0.",
        });
      }

      vehicle.numberOfSeats = seats;
    }

    // ==========================================
    // 8. GET FILES
    //
    // registrationBook
    // frontView
    // ==========================================

    const files = req.files || {};

    const registrationBook =
      files.registrationBook?.[0];

    const frontView =
      files.frontView?.[0];

    // ==========================================
    // 9. ALLOWED IMAGE TYPES
    // ==========================================

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    // ==========================================
    // 10. UPDATE REGISTRATION BOOK
    // ==========================================

    if (registrationBook) {
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

      // Save old image
      if (
        vehicle.registrationBook?.public_id
      ) {
        oldPublicIdsToDelete.push(
          vehicle.registrationBook.public_id
        );
      }

      // Upload new image
      const uploadResult =
        await uploadToCloudinary(
          registrationBook,
          "vehicles/registrationBooks"
        );

      // Keep new image for rollback
      newUploadedPublicIds.push(
        uploadResult.public_id
      );

      // Update MongoDB
      vehicle.registrationBook = {
        url: uploadResult.url,
        public_id:
          uploadResult.public_id,
      };
    }

    // ==========================================
    // 11. UPDATE FRONT VIEW
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
            "Front vehicle image must be JPG, JPEG or PNG.",
        });
      }

      // Save old image
      if (
        vehicle.vehicleImages?.frontView
          ?.public_id
      ) {
        oldPublicIdsToDelete.push(
          vehicle.vehicleImages.frontView
            .public_id
        );
      }

      // Upload new image
      const uploadResult =
        await uploadToCloudinary(
          frontView,
          "vehicles/images"
        );

      // Keep new image for rollback
      newUploadedPublicIds.push(
        uploadResult.public_id
      );

      // Update MongoDB
      vehicle.vehicleImages.frontView = {
        url: uploadResult.url,
        public_id:
          uploadResult.public_id,
      };

      vehicle.markModified(
        "vehicleImages.frontView"
      );
    }

    // ==========================================
    // 12. UPDATED BY
    // ==========================================

    vehicle.updatedBy = driverId;

    // ==========================================
    // 13. SAVE VEHICLE
    // ==========================================

    const updatedVehicle =
      await vehicle.save();

    // ==========================================
    // 14. DELETE OLD CLOUDINARY IMAGES
    // AFTER DB SAVE SUCCESS
    // ==========================================

    if (
      oldPublicIdsToDelete.length > 0
    ) {
      await Promise.allSettled(
        oldPublicIdsToDelete.map(
          (publicId) =>
            deleteFromCloudinary(
              publicId
            )
        )
      );
    }

    // ==========================================
    // 15. SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Vehicle updated successfully.",
      vehicle: updatedVehicle,
    });

  } catch (error) {
    console.error(
      "Vehicle update error:",
      error
    );

    // ==========================================
    // ROLLBACK NEW CLOUDINARY IMAGES
    // ==========================================

    if (
      newUploadedPublicIds.length > 0
    ) {
      await Promise.allSettled(
        newUploadedPublicIds.map(
          (publicId) =>
            deleteFromCloudinary(
              publicId
            )
        )
      );
    }

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      return res.status(409).json({
        success: false,
        message:
          duplicateField ===
            "registrationNumber"
            ? "Registration number already exists."
            : "Vehicle already exists.",
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
    // SERVER ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to update vehicle.",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  updateVehicle,
};