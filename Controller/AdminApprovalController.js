const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");


// ==========================================
// GET PENDING DRIVER + VEHICLE
// ==========================================
exports.getPendingDriverVehicle = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Pending",
        })
            .select("-Password")
            .sort({ createdAt: -1 });

        const result = [];

        for (const driver of drivers) {
            const vehicle = await Vehicle.findOne({
                driver: driver._id,
            });

            result.push({
                driver,
                vehicle,
            });
        }

        res.status(200).json({
            success: true,
            count: result.length,
            data: result,
        });

    } catch (error) {
        console.error("Get Pending Driver Vehicle Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pending driver and vehicle",
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
            .sort({ createdAt: -1 });

        const result = [];

        for (const driver of drivers) {
            const vehicle = await Vehicle.findOne({
                driver: driver._id,
            });

            result.push({
                driver,
                vehicle,
            });
        }

        res.status(200).json({
            success: true,
            count: result.length,
            data: result,
        });

    } catch (error) {
        console.error("Get All Driver Vehicle Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch drivers and vehicles",
        });
    }
};


// ==========================================
// UPDATE DRIVER + VEHICLE STATUS
// ==========================================
exports.updateDriverVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;

        // Validate status
        if (!["Pending", "Verified", "Rejected"].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Pending, Verified or Rejected",
            });
        }

        // Find Driver
        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        // Find Vehicle
        const vehicle = await Vehicle.findOne({
            driver: driver._id,
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found for this driver",
            });
        }

        // Update Driver
        driver.verificationStatus = verificationStatus;

        // Update Vehicle
        vehicle.verificationStatus = verificationStatus;

        await driver.save();
        await vehicle.save();

        const driverResult = driver.toObject();

        delete driverResult.Password;

        res.status(200).json({
            success: true,
            message: `Driver and vehicle ${verificationStatus} successfully`,
            data: {
                driver: driverResult,
                vehicle: vehicle,
            },
        });

    } catch (error) {
        console.error("Update Driver Vehicle Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update driver and vehicle status",
            error: error.message,
        });
    }
};