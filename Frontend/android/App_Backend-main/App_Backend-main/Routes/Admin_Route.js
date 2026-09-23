const express = require("express");

const router = express.Router();

const {
    // DRIVER
    getPendingDrivers,
    getAllDrivers,
    getVerifiedDrivers,
    getRejectedDrivers,
    updateVerificationStatus,

    // VEHICLE
    getPendingVehicles,
    getAllVehicles,
    getVerifiedVehicles,
    getRejectedVehicles,
    updateVehicleVerificationStatus,

} = require("../Controller/Admincontroller");


// DRIVER ROUTES
// Get pending drivers
router.get(
    "/driver/pending",
    getPendingDrivers
);

// Get all drivers
router.get(
    "/driver",
    getAllDrivers
);

// Get verified drivers
router.get(
    "/driver/verified",
    getVerifiedDrivers
);

// Get rejected drivers
router.get(
    "/driver/rejected",
    getRejectedDrivers
);

// Verify / Reject driver
router.patch(
    "/driver/:id/verification",
    updateVerificationStatus
);


// ======================================================
// VEHICLE ROUTES
// ======================================================

// Get pending vehicles
router.get(
    "/vehicle/pending",
    getPendingVehicles
);

// Get all vehicles
router.get(
    "/vehicle",
    getAllVehicles
);

// Get verified vehicles
router.get(
    "/vehicle/verified",
    getVerifiedVehicles
);

// Get rejected vehicles
router.get(
    "/vehicle/rejected",
    getRejectedVehicles
);

// Verify / Reject vehicle
router.patch(
    "/vehicle/:id/verification",
    updateVehicleVerificationStatus
);


module.exports = router;