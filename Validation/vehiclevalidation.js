const Joi = require("joi");

const VehicleSchema = Joi.object({
  // Vehicle Make
  vehicleMake: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Vehicle make is required",
      "any.required": "Vehicle make is required",
    }),

  // Vehicle Model
  vehicleModel: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Vehicle model is required",
      "any.required": "Vehicle model is required",
    }),

  // Vehicle Variant
  variant: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Vehicle variant is required",
      "any.required": "Vehicle variant is required",
    }),

  // Number of Seats (Multipart form-data strings ko integer mein convert kar deta hai)
  numberOfSeats: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Number of seats must be a number",
      "number.integer": "Number of seats must be an integer",
      "number.min": "Number of seats must be at least 1",
      "any.required": "Number of seats is required",
    }),

  // Registration Number
  registrationNumber: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      "string.empty": "Registration number is required",
      "any.required": "Registration number is required",
    }),

  // Vehicle Color
  vehicleColor: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Vehicle color is required",
      "any.required": "Vehicle color is required",
    }),

  // Audit Fields (Optional in Joi, Handled in Controller/Middleware)
  createdBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  updatedBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
}).unknown(true); // Multer files aur internal parameters allow karne ke liye

module.exports = VehicleSchema;