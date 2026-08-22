const Driver = require("../Schema/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const { parseGlobalPhoneNumber } = require("../utils/CountryCode");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
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
    let {
      Name,
      CountryCode,
      PhoneNumber,
      Email,
      Password,
      ConfirmPassword,
      CnicNumber,
      License,
      LicenseExpiryDate,
      CountryIso,
      backgroundCheckConsent,
    } = req.body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      !Name ||
      !CountryCode ||
      !PhoneNumber ||
      !Email ||
      !Password ||
      !ConfirmPassword ||
      !CnicNumber ||
      !License ||
      !LicenseExpiryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // ==========================================
    // PASSWORD CONFIRMATION
    // ==========================================

    if (Password !== ConfirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match.",
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
    // PARSE & VALIDATE PHONE NUMBER
    // ==========================================

    const rawInput =
      CountryCode && !PhoneNumber.startsWith("+")
        ? `${CountryCode}${PhoneNumber}`
        : PhoneNumber;

    const parsedPhone = parseGlobalPhoneNumber(
      rawInput,
      CountryIso || "PK"
    );

    if (!parsedPhone || !parsedPhone.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number or country code.",
      });
    }

    const finalCountryCode = parsedPhone.countryCode;
    const finalPhoneNumber = parsedPhone.formattedLocal;
    const finalCountryIso = parsedPhone.countryIso;

    const cleanEmail = Email.toLowerCase().trim();

    // ==========================================
    // CHECK EXISTING DRIVER
    // ==========================================

    const existingDriver = await Driver.findOne({
      $or: [
        {
          PhoneNumber: finalPhoneNumber,
          CountryCode: finalCountryCode,
        },
        {
          Email: cleanEmail,
        },
        {
          CnicNumber: CnicNumber.trim(),
        },
        {
          License: License.trim(),
        },
      ],
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message:
          "Driver already exists with this phone number, email, CNIC or license.",
      });
    }

    // ==========================================
    // UPLOAD IMAGES TO CLOUDINARY
    // ==========================================

    const driverPhoto = await uploadToCloudinary(
      files.driverPhoto[0].buffer,
      "drivers/driverphoto"
    );

    const CnicFront = await uploadToCloudinary(
      files.CnicFront[0].buffer,
      "drivers/cnic"
    );

    const CnicBack = await uploadToCloudinary(
      files.CnicBack[0].buffer,
      "drivers/cnic"
    );

    const LicenseFront = await uploadToCloudinary(
      files.LicenseFront[0].buffer,
      "drivers/license"
    );

    const LicenseBack = await uploadToCloudinary(
      files.LicenseBack[0].buffer,
      "drivers/license"
    );

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(Password, 10);

    // ==========================================
    // GENERATE DRIVER REFERENCE ID
    // ==========================================

    const driverReferenceId = generateDriverReferenceId();

    // ==========================================
    // CREATE DRIVER
    // ==========================================

    const newDriver = new Driver({
      Name: Name.trim(),

      driverReferenceId,

      CountryCode: finalCountryCode,

      PhoneNumber: finalPhoneNumber,

      CountryIso: finalCountryIso,

      Email: cleanEmail,

      CnicNumber: CnicNumber.trim(),

      License: License.trim(),

      LicenseExpiryDate,

      Password: hashedPassword,

      backgroundCheckConsent:
        backgroundCheckConsent === true ||
        backgroundCheckConsent === "true",

      // Admin verification is required
      verificationStatus: "Pending",

      driverPhoto,

      CnicFront,

      CnicBack,

      LicenseFront,

      LicenseBack,
    });

    await newDriver.save();

    // ==========================================
    // GENERATE TOKEN
    // ==========================================

    const token = generateToken(newDriver._id);

    // ==========================================
    // REMOVE PASSWORD FROM RESPONSE
    // ==========================================

    const driverResponse = newDriver.toObject();

    delete driverResponse.Password;

    // ConfirmPassword was never added to MongoDB
    // so there is nothing to delete here.

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
    console.error("Register Driver Error:", error);

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(409).json({
        success: false,
        message: `Driver already exists with this ${duplicateField}.`,
      });
    }

    // ==========================================
    // MONGOOSE VALIDATION ERROR
    // ==========================================

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: "Driver data validation failed.",
        errors: validationErrors,
      });
    }

    // ==========================================
    // CLOUDINARY ERROR
    // ==========================================

    if (error.http_code || error.name === "UploadError") {
      return res.status(500).json({
        success: false,
        message: "Document upload failed. Please try again.",
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
    const drivers = await Driver.find().select("-Password");

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error("Get Drivers Error:", error);

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
    const driver = await Driver.findById(req.params.id).select(
      "-Password"
    );

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
    console.error("Get Driver By ID Error:", error);

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
    const updates = { ...req.body };

    // ==========================================
    // PROTECTED FIELDS
    // ==========================================

    delete updates.Password;
    delete updates.ConfirmPassword;
    delete updates.driverReferenceId;
    delete updates.verificationStatus;

    // ==========================================
    // UPDATE PHONE NUMBER
    // ==========================================

    if (updates.PhoneNumber) {
      const rawInput =
        updates.CountryCode &&
          !updates.PhoneNumber.startsWith("+")
          ? `${updates.CountryCode}${updates.PhoneNumber}`
          : updates.PhoneNumber;

      const parsedPhone = parseGlobalPhoneNumber(
        rawInput,
        updates.CountryIso || "PK"
      );

      if (!parsedPhone || !parsedPhone.isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number or country code.",
        });
      }

      updates.CountryCode = parsedPhone.countryCode;
      updates.PhoneNumber = parsedPhone.formattedLocal;
      updates.CountryIso = parsedPhone.countryIso;
    }

    // ==========================================
    // NORMALIZE EMAIL
    // ==========================================

    if (updates.Email) {
      updates.Email = updates.Email.toLowerCase().trim();
    }

    // ==========================================
    // NORMALIZE NAME
    // ==========================================

    if (updates.Name) {
      updates.Name = updates.Name.trim();
    }

    // ==========================================
    // UPDATE CNIC
    // ==========================================

    if (updates.CnicNumber) {
      updates.CnicNumber = updates.CnicNumber.trim();
    }

    // ==========================================
    // UPDATE LICENSE
    // ==========================================

    if (updates.License) {
      updates.License = updates.License.trim();
    }

    // ==========================================
    // UPDATE IMAGES
    // ==========================================

    const files = req.files || {};

    if (files.driverPhoto?.[0]) {
      updates.driverPhoto = await uploadToCloudinary(
        files.driverPhoto[0].buffer,
        "drivers/driverphoto"
      );
    }

    if (files.CnicFront?.[0]) {
      updates.CnicFront = await uploadToCloudinary(
        files.CnicFront[0].buffer,
        "drivers/cnic"
      );
    }

    if (files.CnicBack?.[0]) {
      updates.CnicBack = await uploadToCloudinary(
        files.CnicBack[0].buffer,
        "drivers/cnic"
      );
    }

    if (files.LicenseFront?.[0]) {
      updates.LicenseFront = await uploadToCloudinary(
        files.LicenseFront[0].buffer,
        "drivers/license"
      );
    }

    if (files.LicenseBack?.[0]) {
      updates.LicenseBack = await uploadToCloudinary(
        files.LicenseBack[0].buffer,
        "drivers/license"
      );
    }

    // ==========================================
    // UPDATE DRIVER
    // ==========================================

    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
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
      message: "Driver updated successfully.",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Update Driver Error:", error);

    // ==========================================
    // DUPLICATE KEY
    // ==========================================

    if (error.code === 11000) {
      const duplicateField = Object.keys(
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

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: "Driver data validation failed.",
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

module.exports = {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
};