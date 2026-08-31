const uploadVehicle = require("../Multer/Vehicle_upload");

// MULTER FIELDS
const fieldsMiddleware = uploadVehicle.fields([
  { name: "registrationBookFront", maxCount: 1 },
  { name: "registrationBookBack", maxCount: 1 },
  { name: "frontView", maxCount: 1 },
]);


// MULTER ERROR HANDLING

const handleMulterUpload = (req, res, next) => {

  fieldsMiddleware(req, res, (err) => {

    if (err) {

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size is too large. Max allowed size is 5MB per file.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: `Unexpected field '${err.field}'. Only 'registrationBookFront', 'registrationBookBack' and 'frontView' are allowed.`,
        });
      }

      return res.status(400).json({
        success: false,
        message: `Upload Error: ${err.message}`,
      });
    }

    next();
  });
};


// CREATE VEHICLE
const vehicleCreateUpload = (req, res, next) => {

  handleMulterUpload(req, res, (err) => {

    if (err) {
      return next(err);
    }

    const requiredFields = [
      "registrationBookFront",
      "registrationBookBack",
      "frontView",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !req.files ||
        !req.files[field] ||
        req.files[field].length === 0
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required file fields: ${missingFields.join(", ")}`,
      });
    }

    next();
  });
};


// UPDATE VEHICLE
const vehicleUpdateUpload = (req, res, next) => {
  handleMulterUpload(req, res, next);
};


// EXPORT

module.exports = {
  vehicleUpload: vehicleCreateUpload,
  vehicleCreateUpload,
  vehicleUpdateUpload,
};