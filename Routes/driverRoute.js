const express = require("express");
const router = express.Router();

const Authr = require("../Middleware/Authr");
const driverUpload = require("../Middleware/driverupload");
const validateDriver = require("../Middleware/drivervalidation");

// CONTROLLERS
const {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
} = require("../Controller/Driver");

// Separate Login Controller
const {
  loginDriver
} = require("../Controller/login");

// 1. REGISTER DRIVER
router.post(
  "/register",
  driverUpload,
  validateDriver,
  registerDriver
);

// 2. LOGIN DRIVER
// router.post(
//   "/login",
//   loginDriver
// );
// 2. LOGIN DRIVER

router.post(
  "/login",
  (req, res, next) => {
    console.log("🔥🔥🔥 LOGIN ROUTE HIT 🔥🔥🔥");
    console.log("BODY:", req.body);
    next();
  },
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
  "/:id",
  Authr,
  driverUpload,
  validateDriver,
  updateDriver
);

module.exports = router;