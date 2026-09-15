const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    getAssignedRides,
    getNewRideRequests,
    getRideDetails,
    updateRideRequestStatus,
    startRide,
    completeRide
} = require("../Controller/DriverRideController");

router.get("/assigned", Authr, getAssignedRides);

router.get("/requests", Authr, getNewRideRequests);

router.patch(
    "/:rideId/request-status",
    Authr,
    updateRideRequestStatus
);

router.patch(
    "/:rideId/start",
    Authr,
    startRide
);

router.patch(
    "/:rideId/complete",
    Authr,
    completeRide
);

router.get("/:rideId", Authr, getRideDetails);

module.exports = router;