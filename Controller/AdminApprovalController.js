const mongoose = require("mongoose");
const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");

// ==========================================
// GET PENDING DRIVER + VEHICLE
// ==========================================
exports.getPendingDriverVehicle = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Pending"
        })
            .select("-Password")
            .sort({ createdAt: -1 })
            .lean();

        const result = [];

        for (const driver of drivers) {
            const vehicle = await Vehicle.findOne({
                driver: driver._id
            }).lean();

            result.push({
                driver,
                vehicle
            });
        }

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error("Get Pending Driver Vehicle Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending driver and vehicle",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL DRIVER + VEHICLE
// ==========================================
exports.getAllDriverVehicle = async (req, res) => {
    try {
        const drivers = await Driver.find()
            .select("-Password")
            .sort({ createdAt: -1 })
            .lean();

        const result = [];

        for (const driver of drivers) {
            const vehicle = await Vehicle.findOne({
                driver: driver._id
            }).lean();

            result.push({
                driver,
                vehicle
            });
        }

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error("Get All Driver Vehicle Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch drivers and vehicles",
            error: error.message
        });
    }
};


// ==========================================
// APPROVE DRIVER + VEHICLE
// ==========================================
exports.approveDriverVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        const vehicle = await Vehicle.findOne({
            driver: driver._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found for this driver"
            });
        }

        driver.verificationStatus = "Verified";
        vehicle.verificationStatus = "Verified";

        await driver.save();
        await vehicle.save();

        const driverResult = driver.toObject();
        delete driverResult.Password;

        return res.status(200).json({
            success: true,
            message: "Driver and vehicle approved successfully",
            data: {
                driver: driverResult,
                vehicle
            }
        });

    } catch (error) {
        console.error("Approve Driver Vehicle Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to approve driver and vehicle",
            error: error.message
        });
    }
};


// ==========================================
// REJECT DRIVER + VEHICLE
// ==========================================
exports.rejectDriverVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        const vehicle = await Vehicle.findOne({
            driver: driver._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found for this driver"
            });
        }

        driver.verificationStatus = "Rejected";
        driver.updateAdminMessage = reason.trim();

        vehicle.verificationStatus = "Rejected";

        await driver.save();
        await vehicle.save();

        const driverResult = driver.toObject();
        delete driverResult.Password;

        return res.status(200).json({
            success: true,
            message: "Driver and vehicle rejected successfully",
            data: {
                driver: driverResult,
                vehicle,
                rejectionReason: reason.trim()
            }
        });

    } catch (error) {
        console.error("Reject Driver Vehicle Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to reject driver and vehicle",
            error: error.message
        });
    }
};


// ==========================================
// GET APPROVAL STATISTICS
// ==========================================
exports.getApprovalStats = async (req, res) => {
    try {
        const [
            totalDrivers,
            approvedDrivers,
            pendingDrivers,
            rejectedDrivers,
            totalVehicles,
            approvedVehicles,
            pendingVehicles,
            rejectedVehicles
        ] = await Promise.all([
            Driver.countDocuments(),

            Driver.countDocuments({
                verificationStatus: "Verified"
            }),

            Driver.countDocuments({
                verificationStatus: "Pending"
            }),

            Driver.countDocuments({
                verificationStatus: "Rejected"
            }),

            Vehicle.countDocuments(),

            Vehicle.countDocuments({
                verificationStatus: "Verified"
            }),

            Vehicle.countDocuments({
                verificationStatus: "Pending"
            }),

            Vehicle.countDocuments({
                verificationStatus: "Rejected"
            })
        ]);

        return res.status(200).json({
            success: true,
            message: "Approval statistics retrieved successfully",
            data: {
                drivers: {
                    total: totalDrivers,
                    approved: approvedDrivers,
                    pending: pendingDrivers,
                    rejected: rejectedDrivers
                },
                vehicles: {
                    total: totalVehicles,
                    approved: approvedVehicles,
                    pending: pendingVehicles,
                    rejected: rejectedVehicles
                }
            }
        });

    } catch (error) {
        console.error("Get Approval Stats Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve approval statistics",
            error: error.message
        });
    }
};