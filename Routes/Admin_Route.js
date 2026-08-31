const express = require("express");

const router = express.Router();

const {
    getPendingDriverVehicle,
    getAllDriverVehicle,
    updateDriverVehicleStatus,
} = require("../Controller/AdminApprovalController");


// ==========================================
// GET PENDING DRIVER + VEHICLE
// ==========================================

router.get(
    "/driver-vehicle/pending",
    getPendingDriverVehicle
);


// ==========================================
// GET ALL DRIVER + VEHICLE
// ==========================================

router.get(
    "/driver-vehicle",
    getAllDriverVehicle
);


// ==========================================
// APPROVE / REJECT / PENDING
// ==========================================

router.patch(
    "/driver-vehicle/:id/verification",
    updateDriverVehicleStatus
);


module.exports = router;