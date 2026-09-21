const express = require("express");
const router = express.Router();

const {
    getPendingDriverVehicle,
    getAllDriverVehicle,
    approveDriverVehicle,
    rejectDriverVehicle,
    getApprovalStats
} = require("../Controller/AdminApprovalController");

// GET PENDING DRIVER + VEHICLE
router.get(
    "/driver-vehicle/pending",
    getPendingDriverVehicle
);

// GET ALL DRIVER + VEHICLE
router.get(
    "/driver-vehicle",
    getAllDriverVehicle
);

// APPROVE DRIVER + VEHICLE
router.patch(
    "/driver-vehicle/:id/approve",
    approveDriverVehicle
);

// REJECT DRIVER + VEHICLE
router.patch(
    "/driver-vehicle/:id/reject",
    rejectDriverVehicle
);

// APPROVAL STATS
router.get(
    "/approval-stats",
    getApprovalStats
);

module.exports = router;