const mongoose = require("mongoose");
const Vehicle = require("../Schema/Vehicle");
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
// UPDATE VEHICLE
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
        message: "Unauthorized: Invalid driver token",
      });
    }

    // ==========================================
    // 2. VALIDATE VEHICLE ID
    // ==========================================
    const { id } = req.params;

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
    // 3. FIND ONLY DRIVER'S VEHICLE
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
    // 4. REGISTRATION NUMBER
    // ==========================================
    if (req.body.registrationNumber !== undefined) {
      const formattedRegNum =
        req.body.registrationNumber
          .trim()
          .toUpperCase();

      const existingVehicle =
        await Vehicle.findOne({
          registrationNumber: formattedRegNum,
          _id: { $ne: id },
        });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message:
            "Registration number already belongs to another vehicle",
        });
      }

      vehicle.registrationNumber =
        formattedRegNum;
    }

    // ==========================================
    // 5. UPDATE TEXT FIELDS
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
    // 6. GET FILES
    // ==========================================
    const files = req.files || {};

    const registrationBook =
      files.registrationBook?.[0];

    const frontView =
      files.frontView?.[0];

    // ==========================================
    // 7. REGISTRATION BOOK UPDATE
    // ==========================================
    if (registrationBook) {

      // Registration book must be PNG
      if (
        registrationBook.mimetype !==
        "image/png"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Registration book must be a PNG image",
        });
      }

      // Save old public_id
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

      // Track new image for rollback
      newUploadedPublicIds.push(
        uploadResult.public_id
      );

      // Update MongoDB object
      vehicle.registrationBook = {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      };
    }

    // ==========================================
    // 8. FRONT VIEW UPDATE
    // ==========================================
    if (frontView) {

      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (
        !allowedImageTypes.includes(
          frontView.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Front vehicle image must be JPG, JPEG or PNG",
        });
      }

      // Save old public_id
      if (
        vehicle.vehicleImages?.frontView
          ?.public_id
      ) {
        oldPublicIdsToDelete.push(
          vehicle.vehicleImages.frontView.public_id
        );
      }

      // Upload new image
      const uploadResult =
        await uploadToCloudinary(
          frontView,
          "vehicles/images"
        );

      // Track new image for rollback
      newUploadedPublicIds.push(
        uploadResult.public_id
      );

      // Update MongoDB object
      if (!vehicle.vehicleImages) {
        vehicle.vehicleImages = {};
      }

      vehicle.vehicleImages.frontView = {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      };

      vehicle.markModified(
        "vehicleImages"
      );
    }

    // ==========================================
    // 9. UPDATED BY
    // ==========================================
    vehicle.updatedBy = driverId;

    // ==========================================
    // 10. SAVE MONGODB
    // ==========================================
    const updatedVehicle =
      await vehicle.save();

    // ==========================================
    // 11. DELETE OLD CLOUDINARY IMAGES
    // ONLY AFTER DB SAVE SUCCESS
    // ==========================================
    if (
      oldPublicIdsToDelete.length > 0
    ) {
      await Promise.allSettled(
        oldPublicIdsToDelete.map(
          (publicId) =>
            deleteFromCloudinary(publicId)
        )
      );
    }

    // ==========================================
    // 12. SUCCESS RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });

  } catch (error) {
    console.error(
      "Vehicle update error:",
      error
    );

    // ==========================================
    // ROLLBACK NEW CLOUDINARY UPLOADS
    // ==========================================
    if (
      newUploadedPublicIds.length > 0
    ) {
      await Promise.allSettled(
        newUploadedPublicIds.map(
          (publicId) =>
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
          "Registration number already exists",
      });
    }

    // ==========================================
    // SERVER ERROR
    // ==========================================
    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
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