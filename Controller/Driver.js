const Driver = require("../Schema/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const { parseGlobalPhoneNumber } = require("../utils/CountryCode");

const generateToken = (id) => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const generateDriverReferenceId = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `DRV-${Date.now()}-${random}`;
};

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
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
    ).end(buffer);
  });
};

// REGISTER DRIVER
const registerDriver = async (req, res) => {
  try {
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

    const ConfirmPassword =
      req.body.ConfirmPassword || req.body.confirmPassword;

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

    const missingFields = Object.keys(requiredFields).filter((field) => {
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

    if (Password !== ConfirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match.",
      });
    }

    const licenseExpiry = new Date(LicenseExpiryDate);

    if (isNaN(licenseExpiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid license expiry date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(licenseExpiry);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "License is already expired. Please provide a valid license expiry date.",
      });
    }

    const files = req.files || {};

    const requiredFiles = [
      "driverPhoto",
      "CnicFront",
      "CnicBack",
      "LicenseFront",
      "LicenseBack",
    ];

    const missingFiles = requiredFiles.filter(
      (field) => !files[field]?.[0]
    );

    if (missingFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required driver documents are missing.",
        missingFiles,
      });
    }

    const parsedPhone = parseGlobalPhoneNumber(
      String(PhoneNumber).trim(),
      CountryIso || "PK"
    );

    if (!parsedPhone || !parsedPhone.isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number. Please enter a valid international phone number.",
      });
    }

    const finalCountryCode = parsedPhone.countryCode;
    const finalPhoneNumber = parsedPhone.formattedLocal;
    const finalCountryIso = parsedPhone.countryIso;

    const cleanName = Name.trim();
    const cleanEmail = Email.toLowerCase().trim();
    const cleanCnic = CnicNumber.trim();
    const cleanLicense = License.trim();

    const existingDriver = await Driver.findOne({
      $or: [
        {
          PhoneNumber: finalPhoneNumber,
          CountryCode: finalCountryCode,
        },
        { Email: cleanEmail },
        { CnicNumber: cleanCnic },
        { License: cleanLicense },
      ],
    });

    if (existingDriver) {
      let message = "Driver already exists.";

      if (
        existingDriver.PhoneNumber === finalPhoneNumber &&
        existingDriver.CountryCode === finalCountryCode
      ) {
        message = "Driver already exists with this phone number.";
      } else if (existingDriver.Email === cleanEmail) {
        message = "Driver already exists with this email.";
      } else if (existingDriver.CnicNumber === cleanCnic) {
        message = "Driver already exists with this CNIC.";
      } else if (existingDriver.License === cleanLicense) {
        message = "Driver already exists with this license number.";
      }

      return res.status(409).json({
        success: false,
        message,
      });
    }

    const [
      driverPhoto,
      CnicFront,
      CnicBack,
      LicenseFront,
      LicenseBack,
    ] = await Promise.all([
      uploadToCloudinary(
        files.driverPhoto[0].buffer,
        "drivers/driverphoto"
      ),
      uploadToCloudinary(
        files.CnicFront[0].buffer,
        "drivers/cnic"
      ),
      uploadToCloudinary(
        files.CnicBack[0].buffer,
        "drivers/cnic"
      ),
      uploadToCloudinary(
        files.LicenseFront[0].buffer,
        "drivers/license"
      ),
      uploadToCloudinary(
        files.LicenseBack[0].buffer,
        "drivers/license"
      ),
    ]);

    const hashedPassword = await bcrypt.hash(Password, 10);
    const driverReferenceId = generateDriverReferenceId();

    const newDriver = new Driver({
      Name: cleanName,
      driverReferenceId,
      CountryCode: finalCountryCode,
      PhoneNumber: finalPhoneNumber,
      CountryIso: finalCountryIso,
      Email: cleanEmail,
      CnicNumber: cleanCnic,
      License: cleanLicense,
      LicenseExpiryDate: licenseExpiry,
      Password: hashedPassword,
      backgroundCheckConsent:
        backgroundCheckConsent === true ||
        backgroundCheckConsent === "true",

      verificationStatus: "Pending",
      accountStatus: "Active",
      updateRequired: false,
      expiryWarning: null,
      updateRequestStatus: "None",

      driverPhoto,
      CnicFront,
      CnicBack,
      LicenseFront,
      LicenseBack,
    });

    await newDriver.save();

    const token = generateToken(newDriver._id);

    const driverResponse = newDriver.toObject();

    delete driverResponse.Password;
    delete driverResponse.rememberMe;

    return res.status(201).json({
      success: true,
      message:
        "Driver registered successfully. Your account is pending admin verification.",
      token,
      driver: driverResponse,
    });
  } catch (error) {
    console.error("Register Driver Error:", error);

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          `Driver already exists with this ${duplicateField}.`,
      });
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: "Driver data validation failed.",
        errors: validationErrors,
      });
    }

    if (error.http_code || error.name === "UploadError") {
      return res.status(500).json({
        success: false,
        message: "Document upload failed. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to register driver. Please try again later.",
    });
  }
};

// GET ALL DRIVERS
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .select("-Password -rememberMe")
      .sort({ createdAt: -1 });

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

// GET DRIVER BY ID
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .select("-Password -rememberMe");

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

module.exports = {
  registerDriver,
  getDrivers,
  getDriverById,
};