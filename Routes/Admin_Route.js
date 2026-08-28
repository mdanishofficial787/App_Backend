const express = require("express");
const router = express.Router();

const {
    getPendingDrivers,
    getAllDrivers,
    updateVerificationStatus,
    getPendingDriverUpdates,
    approveDriverUpdate,
    rejectDriverUpdate,
    markDriverUpdateRequired,
} = require("../Controller/AdminDrivercontroller");

const {
    getPendingVehicles,
    getAllVehicles,
    getVerifiedVehicles,
    getRejectedVehicles,
    updateVehicleVerificationStatus,
} = require("../Controller/AdminVehicleController");

// DRIVER

router.get("/driver/pending", getPendingDrivers);

router.get("/driver", getAllDrivers);

router.patch(
    "/driver/:id/verification",
    updateVerificationStatus
);

router.get(
    "/driver/updates/pending",
    getPendingDriverUpdates
);

router.patch(
    "/driver/:id/update/approve",
    approveDriverUpdate
);

router.patch(
    "/driver/:id/update/reject",
    rejectDriverUpdate
);

router.patch(
    "/driver/:id/update-required",
    markDriverUpdateRequired
);

// VEHICLE

router.get(
    "/vehicle/pending",
    getPendingVehicles
);

router.get(
    "/vehicle",
    getAllVehicles
);

router.get(
    "/vehicle/verified",
    getVerifiedVehicles
);

router.get(
    "/vehicle/rejected",
    getRejectedVehicles
);

router.patch(
    "/vehicle/:id/verification",
    updateVehicleVerificationStatus
);

module.exports = router;