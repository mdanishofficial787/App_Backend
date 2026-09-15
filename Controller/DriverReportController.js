const mongoose = require("mongoose");

const DriverReport = require("../Schema/DriverReport");
const Ride = require("../Schema/Ride");

// =====================================================
// CREATE DRIVER REPORT
// =====================================================

const createDriverReport = async (req, res) => {
    try {
        // =================================================
        // 1. GET DRIVER FROM AUTH MIDDLEWARE
        // =================================================

        const driverId = req.user?.id;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: "Driver authentication required.",
            });
        }

        // =================================================
        // 2. GET DATA FROM REQUEST
        // =================================================

        const {
            rideId,
            issueCategory,
            description,
        } = req.body;

        // =================================================
        // 3. REQUIRED FIELD VALIDATION
        // =================================================

        if (!rideId) {
            return res.status(400).json({
                success: false,
                message: "Ride ID is required.",
            });
        }

        if (!issueCategory) {
            return res.status(400).json({
                success: false,
                message: "Issue category is required.",
            });
        }

        // =================================================
        // 4. VALIDATE RIDE ID
        // =================================================

        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ride ID.",
            });
        }

        // =================================================
        // 5. VALIDATE ISSUE CATEGORY
        // =================================================

        const allowedCategories = [
            "Passenger No-Show",
            "Payment Issue",
            "Route/Navigation Problem",
            "Passenger Behavior",
            "Other",
        ];

        if (!allowedCategories.includes(issueCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue category.",
            });
        }

        // =================================================
        // 6. FIND RIDE
        // =================================================

        const ride = await Ride.findById(rideId);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Ride not found.",
            });
        }

        // =================================================
        // 7. CHECK RIDE BELONGS TO LOGGED-IN DRIVER
        // =================================================

        if (!ride.driver) {
            return res.status(400).json({
                success: false,
                message: "Driver is not assigned to this ride.",
            });
        }

        if (ride.driver.toString() !== driverId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to report this ride.",
            });
        }

        // =================================================
        // 8. GET PASSENGER FROM RIDE
        // =================================================

        /*
          Agar aapke Ride schema mein passenger field hai:
          ride.passenger
    
          Agar customer field hai:
          ride.customer
    
          Neeche dono support kiye gaye hain.
        */

        const passengerId = ride.passenger || ride.customer;

        if (!passengerId) {
            return res.status(400).json({
                success: false,
                message: "Passenger is not associated with this ride.",
            });
        }

        // =================================================
        // 9. CHECK DESCRIPTION LENGTH
        // =================================================

        const reportDescription =
            typeof description === "string"
                ? description.trim()
                : "";

        if (reportDescription.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 1000 characters.",
            });
        }

        // =================================================
        // 10. GET PHOTO FROM MULTER
        // =================================================

        let photo = null;

        if (req.file) {
            photo = `/uploads/driver-reports/${req.file.filename}`;
        }

        // =================================================
        // 11. CREATE REPORT
        // =================================================

        const report = await DriverReport.create({
            driver: driverId,

            ride: ride._id,

            passenger: passengerId,

            issueCategory: issueCategory,

            description: reportDescription,

            photo: photo,

            status: "Pending",

            createdBy: driverId,

            updatedBy: driverId,
        });

        // =================================================
        // 12. SUCCESS RESPONSE
        // =================================================

        return res.status(201).json({
            success: true,
            message: "Issue report submitted successfully.",

            data: {
                reportId: report._id,

                driver: report.driver,

                ride: report.ride,

                passenger: report.passenger,

                issueCategory: report.issueCategory,

                description: report.description,

                photo: report.photo,

                status: report.status,

                createdBy: report.createdBy,

                updatedBy: report.updatedBy,

                createdAt: report.createdAt,

                updatedAt: report.updatedAt,
            },
        });

    } catch (error) {
        // =================================================
        // ERROR HANDLING
        // =================================================

        console.error(
            "Create Driver Report Error:",
            error
        );

        // Mongoose validation error
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid report data.",
                errors: Object.values(error.errors).map(
                    (err) => err.message
                ),
            });
        }

        // Invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid data provided.",
            });
        }

        // General server error
        return res.status(500).json({
            success: false,
            message: "Failed to submit issue report.",
            error: error.message,
        });
    }
};

module.exports = {
    createDriverReport,
};