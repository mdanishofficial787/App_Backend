const express = require("express");
const router = express.Router();
const Authr = require("../Middleware/Authr");
const driverUpload = require("../Middleware/driverupload");
const validateDriver = require("../Middleware/drivervalidation");

// 1. Controllers Import
const {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
} = require("../Controller/Drive");

// Separate Login Controller Import
const { loginDriver } = require("../Controller/login");

// 2. REGISTER DRIVER (Public - Returns Token in response)
router.post(
  "/register",
  driverUpload,
  validateDriver,
  registerDriver
);

// 3. LOGIN DRIVER (Public - Returns JWT Token)
router.post(
  "/login",
  loginDriver
);

// 4. GET ALL DRIVERS (Protected)
router.get(
  "/",
  Authr,
  getDrivers
);

// 5. GET DRIVER BY ID (Protected)
router.get(
  "/:id",
  Authr,
  getDriverById
);

// 6. UPDATE DRIVER (Protected)
router.patch(
  "/:id",
  Authr,
  driverUpload,
  validateDriver,
  updateDriver
);

module.exports = router;