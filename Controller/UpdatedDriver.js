const mongoose = require("mongoose");
const Driver = require("../Schema/Driver");
const cloudinary = require("../config/cloudinary");
const { parseGlobalPhoneNumber } = require("../utils/CountryCode");

// ===============================
// UPLOAD TO CLOUDINARY
// ===============================
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

// ===============================
// DELETE FROM CLOUDINARY
// ===============================
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

// ===============================
// UPDATE DRIVER
// DRIVER → ADMIN APPROVAL
// ===============================
const updateDriver = async (req, res) => {
    const newUploadedPublicIds = [];

    try {
        // DRIVER ID FROM JWT
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

        // FIND DRIVER
        const driver = await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found.",
            });
        }

        // ALREADY PENDING
        if (driver.updateRequestStatus === "Pending") {
            return res.status(409).json({
                success: false,
                message:
                    "You already have a pending update request. Please wait for admin approval.",
            });
        }

        // ===============================
        // PROTECTED FIELDS
        // ===============================
        delete req.body.Password;
        delete req.body.ConfirmPassword;
        delete req.body.confirmPassword;

        delete req.body._id;
        delete req.body.driverReferenceId;
        delete req.body.verificationStatus;
        delete req.body.accountStatus;
        delete req.body.updateRequired;
        delete req.body.expiryWarning;
        delete req.body.updateRequestStatus;
        delete req.body.pendingUpdate;
        delete req.body.createdAt;
        delete req.body.updatedAt;

        const pendingUpdate = {};

        // ===============================
        // NAME
        // ===============================
        if (req.body.Name !== undefined) {
            const name = String(req.body.Name).trim();

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty.",
                });
            }

            pendingUpdate.Name = name;
        }

        // ===============================
        // PHONE
        // ===============================
        if (req.body.PhoneNumber !== undefined) {
            const phone = String(req.body.PhoneNumber).trim();

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot be empty.",
                });
            }

            const parsedPhone = parseGlobalPhoneNumber(
                phone,
                req.body.CountryIso ||
                driver.CountryIso ||
                "PK"
            );

            if (!parsedPhone || !parsedPhone.isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid phone number.",
                });
            }

            const existingDriver = await Driver.findOne({
                PhoneNumber: parsedPhone.formattedLocal,
                CountryCode: parsedPhone.countryCode,
                _id: { $ne: driverId },
            });

            if (existingDriver) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This phone number already belongs to another driver.",
                });
            }

            pendingUpdate.PhoneNumber =
                parsedPhone.formattedLocal;

            pendingUpdate.CountryCode =
                parsedPhone.countryCode;

            pendingUpdate.CountryIso =
                parsedPhone.countryIso;
        }

        // ===============================
        // EMAIL
        // ===============================
        if (req.body.Email !== undefined) {
            const email = String(req.body.Email)
                .trim()
                .toLowerCase();

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email cannot be empty.",
                });
            }

            const existingDriver = await Driver.findOne({
                Email: email,
                _id: { $ne: driverId },
            });

            if (existingDriver) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email already belongs to another driver.",
                });
            }

            pendingUpdate.Email = email;
        }

        // ===============================
        // CNIC
        // ===============================
        if (req.body.CnicNumber !== undefined) {
            const cnic = String(
                req.body.CnicNumber
            ).trim();

            if (!cnic) {
                return res.status(400).json({
                    success: false,
                    message:
                        "CNIC number cannot be empty.",
                });
            }

            const existingDriver = await Driver.findOne({
                CnicNumber: cnic,
                _id: { $ne: driverId },
            });

            if (existingDriver) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This CNIC already belongs to another driver.",
                });
            }

            pendingUpdate.CnicNumber = cnic;
        }

        // ===============================
        // LICENSE
        // ===============================
        if (req.body.License !== undefined) {
            const license = String(
                req.body.License
            ).trim();

            if (!license) {
                return res.status(400).json({
                    success: false,
                    message:
                        "License number cannot be empty.",
                });
            }

            const existingDriver = await Driver.findOne({
                License: license,
                _id: { $ne: driverId },
            });

            if (existingDriver) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This license already belongs to another driver.",
                });
            }

            pendingUpdate.License = license;
        }

        // ===============================
        // LICENSE EXPIRY DATE
        // ===============================
        if (req.body.LicenseExpiryDate !== undefined) {
            const expiryDate = new Date(
                req.body.LicenseExpiryDate
            );

            if (isNaN(expiryDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid license expiry date.",
                });
            }

            pendingUpdate.LicenseExpiryDate =
                expiryDate;
        }

        // ===============================
        // BACKGROUND CHECK
        // ===============================
        if (
            req.body.backgroundCheckConsent !==
            undefined
        ) {
            pendingUpdate.backgroundCheckConsent =
                req.body.backgroundCheckConsent === true ||
                req.body.backgroundCheckConsent ===
                "true";
        }

        // ===============================
        // FILES
        // ===============================
        const files = req.files || {};

        // DRIVER PHOTO
        if (files.driverPhoto?.[0]) {
            const result = await uploadToCloudinary(
                files.driverPhoto[0],
                "drivers/driverphoto"
            );

            newUploadedPublicIds.push(
                result.public_id
            );

            pendingUpdate.driverPhoto = result;
        }

        // CNIC FRONT
        if (files.CnicFront?.[0]) {
            const result = await uploadToCloudinary(
                files.CnicFront[0],
                "drivers/cnic"
            );

            newUploadedPublicIds.push(
                result.public_id
            );

            pendingUpdate.CnicFront = result;
        }

        // CNIC BACK
        if (files.CnicBack?.[0]) {
            const result = await uploadToCloudinary(
                files.CnicBack[0],
                "drivers/cnic"
            );

            newUploadedPublicIds.push(
                result.public_id
            );

            pendingUpdate.CnicBack = result;
        }

        // LICENSE FRONT
        if (files.LicenseFront?.[0]) {
            const result = await uploadToCloudinary(
                files.LicenseFront[0],
                "drivers/license"
            );

            newUploadedPublicIds.push(
                result.public_id
            );

            pendingUpdate.LicenseFront = result;
        }

        // LICENSE BACK
        if (files.LicenseBack?.[0]) {
            const result = await uploadToCloudinary(
                files.LicenseBack[0],
                "drivers/license"
            );

            newUploadedPublicIds.push(
                result.public_id
            );

            pendingUpdate.LicenseBack = result;
        }

        // ===============================
        // NOTHING TO UPDATE
        // ===============================
        if (
            Object.keys(pendingUpdate).length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No information was provided for update.",
            });
        }

        // ===============================
        // SAVE REQUEST
        // ===============================
        driver.pendingUpdate = pendingUpdate;
        driver.updateRequestStatus = "Pending";

        await driver.save();

        // ===============================
        // RESPONSE
        // ===============================
        return res.status(200).json({
            success: true,
            message:
                "Update request submitted successfully. Your changes are pending admin approval.",
            updateRequestStatus:
                driver.updateRequestStatus,
            pendingUpdate: driver.pendingUpdate,
        });

    } catch (error) {
        console.error(
            "Update Driver Error:",
            error
        );

        // DELETE NEW FILES IF DB SAVE FAILS
        if (newUploadedPublicIds.length > 0) {
            await Promise.allSettled(
                newUploadedPublicIds.map(
                    (publicId) =>
                        deleteFromCloudinary(
                            publicId
                        )
                )
            );
        }

        // DUPLICATE
        if (error.code === 11000) {
            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                )[0];

            const messages = {
                CnicNumber:
                    "CNIC already exists.",
                License:
                    "License number already exists.",
                Email:
                    "Email already exists.",
                PhoneNumber:
                    "Phone number already exists.",
            };

            return res.status(409).json({
                success: false,
                message:
                    messages[duplicateField] ||
                    `Driver already exists with this ${duplicateField}.`,
            });
        }

        // VALIDATION
        if (
            error.name === "ValidationError"
        ) {
            const validationErrors =
                Object.values(
                    error.errors
                ).map(
                    (err) => err.message
                );

            return res.status(400).json({
                success: false,
                message:
                    "Driver data validation failed.",
                errors: validationErrors,
            });
        }

        // CLOUDINARY
        if (
            error.http_code ||
            error.name === "UploadError"
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Document upload failed. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to submit driver update request. Please try again later.",
        });
    }
};

module.exports = {
    updateDriver,
};