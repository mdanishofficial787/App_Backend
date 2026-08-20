const DriverSchema = require("../Validation/driver");

const validateDriver = (req, res, next) => {
  // 1. Joi se validated 'value' extract karein aur 'allowUnknown: true' set karein
  const { error, value } = DriverSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true, // File buffers aur extra form-data fields ko ignore hone de
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  // 2. Type-casted & parsed values ko req.body mein merge karein
  req.body = { ...req.body, ...value };
  
  next();
};

module.exports = validateDriver;