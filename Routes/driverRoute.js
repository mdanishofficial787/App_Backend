const express = require("express");
const router = express.Router();

const Authr = require("../Middleware/Authr");
const driverUpload = require("../Middleware/driverupload");
const validateDriver = require("../Middleware/drivervalidation");

const {
  registerDriver,
  getDrivers,
  getDriverById,
} = require("../Controller/Driver");

const {
  updateDriver,
} = require("../Controller/UpdatedDriver");

const {
  loginDriver,
} = require("../Controller/login");

// 1. REGISTER DRIVER
router.post(
  "/register",
  driverUpload,
  validateDriver,
  registerDriver
);

// 2. LOGIN DRIVER
router.post(
  "/login",
  loginDriver
);

// 3. GET ALL DRIVERS
router.get(
  "/",
  Authr,
  getDrivers
);

// 4. GET DRIVER BY ID
router.get(
  "/:id",
  Authr,
  getDriverById
);

// 5. UPDATE DRIVER
router.patch(
  "/update",
  Authr,
  driverUpload,
  updateDriver
);

module.exports = router;