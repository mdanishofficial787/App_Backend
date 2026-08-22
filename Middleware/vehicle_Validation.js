const VehicleValidation = require("../Validation/vehiclevalidation");

const validateVehicle = (req, res, next) => {
  // 1. Extract 'value' and set 'allowUnknown: true'
  const { error, value } = VehicleValidation.validate(req.body, {
    abortEarly: false,
    allowUnknown: true, // Multer aur extra form-data fields pass hone ke liye
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  // 2. Type-casted & sanitized values ko req.body mein overwrite/merge karein
  req.body = { ...req.body, ...value };

  next();
};

module.exports = validateVehicle;