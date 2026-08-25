const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
  vehicleCreateUpload,
  vehicleUpdateUpload,
} = require("../Middleware/vehicle_upload");

const validateVehicle = require("../Middleware/vehicle_Validation");

const {
  createVehicle,
  getVehicles,
  getVehicleById,
  deleteVehicle,
} = require("../Controller/Vehicle_controller");

const {
  updateVehicle,
} = require("../Controller/update_vehicle");// CREATE VEHICLE

router.post(
  "/register",

  (req, res, next) => {
    next();
  },

  Authr,
  vehicleCreateUpload,
  validateVehicle,
  createVehicle
);

// UPDATE VEHICLE
router.patch(
  "/:id",
  Authr,
  vehicleUpdateUpload,
  validateVehicle,
  updateVehicle
);

// GET ALL VEHICLES
router.get(
  "/",
  Authr,
  getVehicles
);

// GET VEHICLE BY ID
router.get(
  "/:id",
  Authr,
  getVehicleById
);

// DELETE VEHICLE
router.delete(
  "/:id",
  Authr,
  deleteVehicle
);

module.exports = router;