const Driver = require("../Schema/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

// ==========================================
// GENERATE DRIVER REGISTRATION ID
// ==========================================

const generateDriverRegistrationId = () => {
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
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    ).end(buffer);
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
      CnicNumber,
      License,
      LicenseExpiryDate,
      CountryIso,
      backgroundCheckConsent
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!Name || !PhoneNumber || !Password || !Email) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required fields: Name, PhoneNumber, Password and Email"
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
      "LicenseBack"
    ];

    for (const field of requiredImages) {
      if (!files[field]?.[0]) {
        return res.status(400).json({
          success: false,
          message: `Missing required image: ${field}`
        });
      }
    }

    // ==========================================
    // CLEAN COUNTRY CODE
    // ==========================================

    CountryCode = CountryCode
      ? CountryCode.trim()
      : "+92";

    // ==========================================
    // CLEAN PHONE NUMBER
    // ==========================================

    let cleanPhoneNumber = PhoneNumber.toString().trim();

    if (cleanPhoneNumber.startsWith(CountryCode)) {
      cleanPhoneNumber = cleanPhoneNumber
        .slice(CountryCode.length)
        .trim();
    }

    // ==========================================
    // CLEAN EMAIL
    // ==========================================

    const cleanEmail = Email.toLowerCase().trim();

    // ==========================================
    // CHECK EXISTING DRIVER
    // ==========================================

    const existingDriver = await Driver.findOne({
      $or: [
        {
          PhoneNumber: cleanPhoneNumber,
          CountryCode
        },
        {
          Email: cleanEmail
        }
      ]
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message:
          "Driver already exists with this phone number or email"
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

    const hashedPassword = await bcrypt.hash(
      Password,
      10
    );

    // ==========================================
    // GENERATE DRIVER REGISTRATION ID
    // ==========================================

    const driverRegistrationId =
      generateDriverRegistrationId();

    // ==========================================
    // CREATE DRIVER
    // ==========================================

    const newDriver = new Driver({
      Name: Name.trim(),

      CountryCode,

      PhoneNumber: cleanPhoneNumber,

      Email: cleanEmail,

      Password: hashedPassword,

      CnicNumber,

      License,

      LicenseExpiryDate,

      CountryIso: CountryIso || "PK",

      backgroundCheckConsent:
        backgroundCheckConsent === true ||
        backgroundCheckConsent === "true",

      // Unique Driver Reference ID
      driverRegistrationId,

      driverPhoto,

      CnicFront,

      CnicBack,

      LicenseFront,

      LicenseBack
    });

    // ==========================================
    // SAVE DRIVER
    // ==========================================

    await newDriver.save();

    // ==========================================
    // GENERATE JWT TOKEN
    // ==========================================

    const token = generateToken(newDriver._id);

    // ==========================================
    // REMOVE PASSWORD FROM RESPONSE
    // ==========================================

    const driverResponse = newDriver.toObject();

    delete driverResponse.Password;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      token,
      driver: driverResponse
    });

  } catch (error) {

    console.error("Register Driver Error:", error);

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {

      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `Driver already exists with this ${duplicateField}`
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
        message: "Driver data validation failed",
        errors: validationErrors
      });
    }

    // ==========================================
    // CLOUDINARY / UPLOAD ERROR
    // ==========================================

    if (
      error.http_code ||
      error.name === "UploadError"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Document upload failed. Please try again."
      });
    }

    // ==========================================
    // GENERAL SERVER ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Unable to register driver. Please try again later."
    });
  }
};

// ==========================================
// 2. GET ALL DRIVERS
// ==========================================

const getDrivers = async (req, res) => {
  try {

    const drivers = await Driver
      .find()
      .select("-Password");

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });

  } catch (error) {

    console.error("Get Drivers Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve drivers. Please try again later."
    });
  }
};

// ==========================================
// 3. GET DRIVER BY ID
// ==========================================

const getDriverById = async (req, res) => {
  try {

    const driver = await Driver
      .findById(req.params.id)
      .select("-Password");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    return res.status(200).json({
      success: true,
      driver
    });

  } catch (error) {

    console.error("Get Driver By ID Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve driver. Please try again later."
    });
  }
};

// ==========================================
// 4. UPDATE DRIVER
// ==========================================

const updateDriver = async (req, res) => {
  try {

    const updates = {
      ...req.body
    };

    // ==========================================
    // PROTECTED FIELDS
    // ==========================================

    delete updates.Password;
    delete updates.ConfirmPassword;

    // Driver Registration ID should never
    // be changed from update API
    delete updates.driverRegistrationId;

    // ==========================================
    // CLEAN PHONE NUMBER
    // ==========================================

    if (updates.PhoneNumber) {

      const code = updates.CountryCode
        ? updates.CountryCode.trim()
        : "+92";

      let cleanPhoneNumber =
        updates.PhoneNumber.toString().trim();

      if (cleanPhoneNumber.startsWith(code)) {
        cleanPhoneNumber = cleanPhoneNumber
          .slice(code.length)
          .trim();
      }

      updates.PhoneNumber = cleanPhoneNumber;
      updates.CountryCode = code;
    }

    // ==========================================
    // UPDATE FILES
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

    const updatedDriver = await Driver
      .findByIdAndUpdate(
        req.params.id,
        {
          $set: updates
        },
        {
          new: true,
          runValidators: true
        }
      )
      .select("-Password");

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver: updatedDriver
    });

  } catch (error) {

    console.error("Update Driver Error:", error);

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {

      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `Driver already exists with this ${duplicateField}`
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
        message: "Driver data validation failed",
        errors: validationErrors
      });
    }

    // ==========================================
    // GENERAL SERVER ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        "Unable to update driver. Please try again later."
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver
};