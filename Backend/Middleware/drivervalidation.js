const DriverSchema = require("../Validation/driver");
const { DriverUpdateSchema } = require("../Validation/driver");

const validateDriver = (req, res, next) => {
  const { error, value } = DriverSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => d.message),
    });
  }
  req.body = { ...req.body, ...value };
  next();
};

const validateDriverUpdate = (req, res, next) => {
  const { error, value } = DriverUpdateSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => d.message),
    });
  }
  req.body = { ...req.body, ...value };
  next();
};

module.exports = { validateDriver, validateDriverUpdate };