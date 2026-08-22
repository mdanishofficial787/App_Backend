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
} = require("../Controller/update_vehicle");

// ==========================================
// 1. CREATE VEHICLE (Token Protected)
// ==========================================
router.post(
  "/register",
  Authr,
  vehicleCreateUpload,
  validateVehicle,
  createVehicle
);

// ==========================================
// 2. UPDATE VEHICLE (Token Protected)
// ==========================================
router.patch(
  "/:id",
  Authr,
  vehicleUpdateUpload,
  validateVehicle,
  updateVehicle
);

// ==========================================
// 3. GET ALL VEHICLES (Token Protected)
// ==========================================
router.get(
  "/",
  Authr,
  getVehicles
);

// ==========================================
// 4. GET VEHICLE BY ID (Token Protected)
// ==========================================
router.get(
  "/:id",
  Authr,
  getVehicleById
);

// ==========================================
// 5. DELETE VEHICLE (Token Protected)
// ==========================================
router.delete(
  "/:id",
  Authr,
  deleteVehicle
);
// login

module.exports = router;