const mongoose = require("mongoose");

const Ride = require("../Schema/Ride");
const Customer = require("../../Backend/schema/user");


// GET ASSIGNED RIDES
const getAssignedRides = async (req, res) => {
    try {

        const driverId = req.user.id;
        const rides = await Ride.find({
            driver: driverId,
            status: {
                $in: [
                    "ASSIGNED",
                    "APPROVED",
                    "IN_PROGRESS"
                ]
            }
        })
            .populate(
                "passenger",
                "fullName PhoneNumber countryCode profilePicture"
            )
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Assigned rides retrieved successfully",
            count: rides.length,
            rides
        });

    } catch (error) {
        console.error("Get Assigned Rides Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve assigned rides",
            error: error.message
        });
    }
};
// GET NEW RIDE REQUESTS
const getNewRideRequests = async (req, res) => {
    try {

        const driverId = req.user.id;
        const rides = await Ride.find({
            driver: driverId,
            status: "PENDING"
        })
            .populate(
                "passenger",
                "fullName PhoneNumber countryCode profilePicture"
            )
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "New ride requests retrieved successfully",
            count: rides.length,
            rides
        });

    } catch (error) {

        console.error("Get New Ride Requests Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve ride requests",
            error: error.message
        });
    }
};


// GET SINGLE RIDE DETAILS
const getRideDetails = async (req, res) => {
    try {

        const driverId = req.user.id;
        const { rideId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ride ID"
            });
        }
        const ride = await Ride.findOne({
            _id: rideId,
            driver: driverId
        })
            .populate(
                "passenger",
                "fullName PhoneNumber countryCode profilePicture"
            );
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Ride not found or you are not authorized to access this ride"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Ride details retrieved successfully",
            ride
        });

    } catch (error) {

        console.error("Get Ride Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve ride details",
            error: error.message
        });
    }
};


// ======================================================
// APPROVE / REJECT RIDE REQUEST
// ======================================================

const updateRideRequestStatus = async (req, res) => {
    try {

        const driverId = req.user.id;
        const { rideId } = req.params;
        const { status } = req.body;


        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ride ID"
            });
        }


        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be APPROVED or REJECTED"
            });
        }


        const ride = await Ride.findOne({
            _id: rideId,
            driver: driverId,
            status: "PENDING"
        });


        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Pending ride request not found or unauthorized"
            });
        }


        ride.status = status;

        await ride.save();


        return res.status(200).json({
            success: true,
            message: `Ride request ${status.toLowerCase()} successfully`,
            ride
        });

    } catch (error) {

        console.error("Update Ride Request Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update ride request status",
            error: error.message
        });
    }
};


// START RIDE
const startRide = async (req, res) => {
    try {

        const driverId = req.user.id;
        const { rideId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ride ID"
            });
        }
        const ride = await Ride.findOne({
            _id: rideId,
            driver: driverId,
            status: "APPROVED"
        });
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Approved ride not found or unauthorized"
            });
        }


        ride.status = "IN_PROGRESS";
        await ride.save();
        return res.status(200).json({
            success: true,
            message: "Ride started successfully",
            ride
        });

    } catch (error) {

        console.error("Start Ride Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to start ride",
            error: error.message
        });
    }
};
// COMPLETE RIDE
const completeRide = async (req, res) => {
    try {

        const driverId = req.user.id;
        const { rideId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ride ID"
            });
        }
        const ride = await Ride.findOne({
            _id: rideId,
            driver: driverId,
            status: "IN_PROGRESS"
        });


        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Active ride not found or unauthorized"
            });
        }


        ride.status = "COMPLETED";
        await ride.save();
        return res.status(200).json({
            success: true,
            message: "Ride completed successfully",
            ride
        });

    } catch (error) {

        console.error("Complete Ride Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to complete ride",
            error: error.message
        });
    }
};


// EXPORT
module.exports = {
    getAssignedRides,
    getNewRideRequests,
    getRideDetails,
    updateRideRequestStatus,
    startRide,
    completeRide
};