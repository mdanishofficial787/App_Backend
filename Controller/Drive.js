const Driver = require("../Schema/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const { parseGlobalPhoneNumber } = require("../utils/CountryCode");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// GENERATE DRIVER REFERENCE ID
// ==========================================

const generateDriverReferenceId = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `DRV-${Date.now()}-${random}`;
};

// ==========================================
// UPLOAD BUFFER TO CLOUDINARY
// ==========================================

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
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
      )
      .end(buffer);
  });
};

// ==========================================
// 1. REGISTER DRIVER
// ==========================================

const registerDriver = async (req, res) => {
  try {
    // ==========================================
    // GET DATA FROM REQUEST
    // ==========================================

    const {
      Name,
      PhoneNumber,
      Email,
      Password,
      CnicNumber,
      License,
      LicenseExpiryDate,
      CountryIso,
      backgroundCheckConsent,
    } = req.body;

    // Confirm Password frontend se aa sakta hai
    // Lekin MongoDB mein save nahi hoga
    const ConfirmPassword =
      req.body.ConfirmPassword ||
      req.body.confirmPassword;

    // ==========================================
    // DEBUG
    // ==========================================

    console.log("========== DRIVER REGISTER ==========");
    console.log("BODY:", req.body);
    console.log(
      "FILES:",
      Object.keys(req.files || {})
    );

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================
    // IMPORTANT:
    // CountryCode required nahi hai.
    // Backend phone number se khud extract karega.

    const requiredFields = {
      Name,
      PhoneNumber,
      Email,
      Password,
      ConfirmPassword,
      CnicNumber,
      License,
      LicenseExpiryDate,
    };

    const missingFields = Object.keys(
      requiredFields
    ).filter((field) => {
      const value = requiredFields[field];

      return (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      );
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
        missingFields,
      });
    }

    // ==========================================
    // PASSWORD CONFIRMATION
    // ==========================================

    if (Password !== ConfirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match.",
      });
    }

    // ==========================================
    // FILE VALIDATION
    // ==========================================

    const files = req.files || {};

    const requiredImages = [
      "driverPhoto",
      "CnicFront",
      "CnicBack",
      "LicenseFront",
      "LicenseBack",
    ];

    for (const field of requiredImages) {
      if (!files[field]?.[0]) {
        return res.status(400).json({
          success: false,
          message: `Missing required image: ${field}`,
        });
      }
    }

    // ==========================================
    // PHONE NUMBER PARSING
    // ==========================================
    //
    // Frontend example:
    //
    // PhoneNumber = +923117586447
    //
    // Backend automatically converts:
    //
    // CountryCode = +92
    // PhoneNumber = 3117586447
    // CountryIso = PK
    //
    // CountryCode frontend se nahi chahiye.
    // ==========================================

    const rawPhoneNumber =
      String(PhoneNumber).trim();

    const parsedPhone = parseGlobalPhoneNumber(
      rawPhoneNumber,
      CountryIso || "PK"
    );

    if (!parsedPhone || !parsedPhone.isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number. Please enter a valid international phone number.",
      });
    }

    const finalCountryCode =
      parsedPhone.countryCode;

    const finalPhoneNumber =
      parsedPhone.formattedLocal;

    const finalCountryIso =
      parsedPhone.countryIso;

    // ==========================================
    // CLEAN DATA
    // ==========================================

    const cleanName = Name.trim();

    const cleanEmail =
      Email.toLowerCase().trim();

    const cleanCnic =
      CnicNumber.trim();

    const cleanLicense =
      License.trim();

    // ==========================================
    // CHECK EXISTING DRIVER
    // ==========================================

    const existingDriver =
      await Driver.findOne({
        $or: [
          {
            PhoneNumber: finalPhoneNumber,
            CountryCode: finalCountryCode,
          },
          {
            Email: cleanEmail,
          },
          {
            CnicNumber: cleanCnic,
          },
          {
            License: cleanLicense,
          },
        ],
      });

    if (existingDriver) {
      let duplicateMessage =
        "Driver already exists.";

      if (
        existingDriver.PhoneNumber ===
        finalPhoneNumber &&
        existingDriver.CountryCode ===
        finalCountryCode
      ) {
        duplicateMessage =
          "Driver already exists with this phone number.";
      } else if (
        existingDriver.Email === cleanEmail
      ) {
        duplicateMessage =
          "Driver already exists with this email.";
      } else if (
        existingDriver.CnicNumber === cleanCnic
      ) {
        duplicateMessage =
          "Driver already exists with this CNIC.";
      } else if (
        existingDriver.License === cleanLicense
      ) {
        duplicateMessage =
          "Driver already exists with this license number.";
      }

      return res.status(409).json({
        success: false,
        message: duplicateMessage,
      });
    }

    // ==========================================
    // UPLOAD DRIVER PHOTO
    // ==========================================

    const driverPhoto =
      await uploadToCloudinary(
        files.driverPhoto[0].buffer,
        "drivers/driverphoto"
      );

    // ==========================================
    // UPLOAD CNIC FRONT
    // ==========================================

    const CnicFront =
      await uploadToCloudinary(
        files.CnicFront[0].buffer,
        "drivers/cnic"
      );

    // ==========================================
    // UPLOAD CNIC BACK
    // ==========================================

    const CnicBack =
      await uploadToCloudinary(
        files.CnicBack[0].buffer,
        "drivers/cnic"
      );

    // ==========================================
    // UPLOAD LICENSE FRONT
    // ==========================================

    const LicenseFront =
      await uploadToCloudinary(
        files.LicenseFront[0].buffer,
        "drivers/license"
      );

    // ==========================================
    // UPLOAD LICENSE BACK
    // ==========================================

    const LicenseBack =
      await uploadToCloudinary(
        files.LicenseBack[0].buffer,
        "drivers/license"
      );

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(Password, 10);

    // ==========================================
    // GENERATE DRIVER REFERENCE ID
    // ==========================================

    const driverReferenceId =
      generateDriverReferenceId();

    // ==========================================
    // CREATE DRIVER
    // ==========================================

    const newDriver = new Driver({
      Name: cleanName,

      driverReferenceId,

      // Backend automatically stores
      // country code separately
      CountryCode: finalCountryCode,

      // Backend automatically stores
      // local phone number
      PhoneNumber: finalPhoneNumber,

      CountryIso: finalCountryIso,

      Email: cleanEmail,

      CnicNumber: cleanCnic,

      License: cleanLicense,

      LicenseExpiryDate,

      // ONLY HASHED PASSWORD IS STORED
      Password: hashedPassword,

      // ConfirmPassword is NOT included
      // therefore it will NOT be stored in MongoDB

      backgroundCheckConsent:
        backgroundCheckConsent === true ||
        backgroundCheckConsent === "true",

      // Admin verification required
      verificationStatus: "Pending",

      driverPhoto,

      CnicFront,

      CnicBack,

      LicenseFront,

      LicenseBack,
    });

    await newDriver.save();

    // ==========================================
    // GENERATE JWT
    // ==========================================

    const token =
      generateToken(newDriver._id);

    // ==========================================
    // REMOVE PASSWORD FROM RESPONSE
    // ==========================================

    const driverResponse =
      newDriver.toObject();

    delete driverResponse.Password;

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "Driver registered successfully. Your account is pending admin verification.",

      token,

      driver: driverResponse,
    });
  } catch (error) {
    console.error(
      "Register Driver Error:",
      error
    );

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
        message: `Driver already exists with this ${duplicateField}.`,
      });
    }

    // ==========================================
    // MONGOOSE VALIDATION
    // ==========================================

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

    // ==========================================
    // CLOUDINARY ERROR
    // ==========================================

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

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Unable to register driver. Please try again later.",
    });
  }
};

// ==========================================
// 2. GET ALL DRIVERS
// ==========================================

const getDrivers = async (req, res) => {
  try {
    const drivers =
      await Driver.find()
        .select("-Password");

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error(
      "Get Drivers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve drivers. Please try again later.",
    });
  }
};

// ==========================================
// 3. GET DRIVER BY ID
// ==========================================

const getDriverById = async (req, res) => {
  try {
    const driver =
      await Driver.findById(
        req.params.id
      ).select("-Password");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    return res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error(
      "Get Driver By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve driver. Please try again later.",
    });
  }
};

// ==========================================
// 4. UPDATE DRIVER
// ==========================================

const updateDriver = async (req, res) => {
  try {
    const updates = {
      ...req.body,
    };

    // ==========================================
    // PROTECTED FIELDS
    // ==========================================

    delete updates.Password;
    delete updates.ConfirmPassword;
    delete updates.confirmPassword;
    delete updates.driverReferenceId;
    delete updates.verificationStatus;

    // ==========================================
    // PHONE NUMBER
    // ==========================================
    //
    // Frontend sends:
    // PhoneNumber = +923117586447
    //
    // Backend stores:
    // CountryCode = +92
    // PhoneNumber = 3117586447
    // CountryIso = PK
    // ==========================================

    if (updates.PhoneNumber) {
      const rawPhoneNumber =
        String(
          updates.PhoneNumber
        ).trim();

      const parsedPhone =
        parseGlobalPhoneNumber(
          rawPhoneNumber,
          updates.CountryIso || "PK"
        );

      if (
        !parsedPhone ||
        !parsedPhone.isValid
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid phone number.",
        });
      }

      updates.CountryCode =
        parsedPhone.countryCode;

      updates.PhoneNumber =
        parsedPhone.formattedLocal;

      updates.CountryIso =
        parsedPhone.countryIso;
    }

    // ==========================================
    // DO NOT ALLOW FRONTEND TO MANUALLY
    // CHANGE COUNTRY CODE
    // ==========================================

    if (!req.body.PhoneNumber) {
      delete updates.CountryCode;
      delete updates.CountryIso;
    }

    // ==========================================
    // EMAIL
    // ==========================================

    if (updates.Email) {
      updates.Email =
        updates.Email
          .toLowerCase()
          .trim();
    }

    // ==========================================
    // NAME
    // ==========================================

    if (updates.Name) {
      updates.Name =
        updates.Name.trim();
    }

    // ==========================================
    // CNIC
    // ==========================================

    if (updates.CnicNumber) {
      updates.CnicNumber =
        updates.CnicNumber.trim();
    }

    // ==========================================
    // LICENSE
    // ==========================================

    if (updates.License) {
      updates.License =
        updates.License.trim();
    }

    // ==========================================
    // FILES
    // ==========================================

    const files = req.files || {};

    // Driver Photo
    if (files.driverPhoto?.[0]) {
      updates.driverPhoto =
        await uploadToCloudinary(
          files.driverPhoto[0].buffer,
          "drivers/driverphoto"
        );
    }

    // CNIC Front
    if (files.CnicFront?.[0]) {
      updates.CnicFront =
        await uploadToCloudinary(
          files.CnicFront[0].buffer,
          "drivers/cnic"
        );
    }

    // CNIC Back
    if (files.CnicBack?.[0]) {
      updates.CnicBack =
        await uploadToCloudinary(
          files.CnicBack[0].buffer,
          "drivers/cnic"
        );
    }

    // License Front
    if (files.LicenseFront?.[0]) {
      updates.LicenseFront =
        await uploadToCloudinary(
          files.LicenseFront[0].buffer,
          "drivers/license"
        );
    }

    // License Back
    if (files.LicenseBack?.[0]) {
      updates.LicenseBack =
        await uploadToCloudinary(
          files.LicenseBack[0].buffer,
          "drivers/license"
        );
    }

    // ==========================================
    // UPDATE DRIVER
    // ==========================================

    const updatedDriver =
      await Driver.findByIdAndUpdate(
        req.params.id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-Password");

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Driver updated successfully.",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error(
      "Update Driver Error:",
      error
    );

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
        message: `Driver already exists with this ${duplicateField}.`,
      });
    }

    // ==========================================
    // VALIDATION ERROR
    // ==========================================

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

    return res.status(500).json({
      success: false,
      message:
        "Unable to update driver. Please try again later.",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
};