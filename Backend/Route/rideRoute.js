const express = require("express");
const router = express.Router();
const rideController = require("../Controller/RideController");

// Customer routes
router.post("/request", rideController.requestRide);

// Admin routes
router.get("/pending", rideController.getPendingRides);
router.post("/assign", rideController.assignDriver);

// Driver & Admin Ride routes
router.get("/", rideController.getAssignedRides);
router.get("/assigned", rideController.getAssignedRides);
router.get("/driver/:driverId", rideController.getAssignedRides);
router.get("/active/customer", rideController.getActiveRide);
router.get("/active", rideController.getActiveRide);
router.get("/:rideId", rideController.getRideById);
router.put("/status/:rideId", rideController.updateRideStatus);
router.patch("/status/:rideId", rideController.updateRideStatus);
router.put("/:rideId", rideController.updateRideStatus);
router.patch("/:rideId/fare", rideController.updateRideFare);
router.patch("/:rideId", (req, res) => {
  if (req.body && req.body.fare !== undefined) {
    return rideController.updateRideFare(req, res);
  }
  return rideController.updateRideStatus(req, res);
});

module.exports = router;
