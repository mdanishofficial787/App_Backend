const Vehicle = require("../Schema/Vehicle");

// 1. GET PENDING VEHICLES
exports.getPendingVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Pending",
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });
    } catch (error) {
        console.error("Get Pending Vehicles Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pending vehicles",
        });
    }
};

// 2. GET ALL VEHICLES
exports.getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });
    } catch (error) {
        console.error("Get All Vehicles Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vehicles",
        });
    }
};

// 3. GET VERIFIED VEHICLES
exports.getVerifiedVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Verified",
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });
    } catch (error) {
        console.error("Get Verified Vehicles Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch verified vehicles",
        });
    }
};

// 4. GET REJECTED VEHICLES
exports.getRejectedVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Rejected",
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });
    } catch (error) {
        console.error("Get Rejected Vehicles Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch rejected vehicles",
        });
    }
};

// 5. VERIFY / REJECT VEHICLE
exports.updateVehicleVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;

        if (!["Verified", "Rejected"].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Verified or Rejected",
            });
        }

        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        if (vehicle.verificationStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Vehicle is already processed",
            });
        }

        vehicle.verificationStatus = verificationStatus;

        await vehicle.save();

        res.status(200).json({
            success: true,
            message:
                verificationStatus === "Verified"
                    ? "Vehicle verified successfully"
                    : "Vehicle rejected successfully",
            vehicle,
        });
    } catch (error) {
        console.error(
            "Update Vehicle Verification Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update vehicle status",
        });
    }
};