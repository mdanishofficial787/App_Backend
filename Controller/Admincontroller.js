const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");

// ======================================================
// 1. GET ALL PENDING DRIVERS
// ======================================================

exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Pending",
        })
            .select("-Password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });

    } catch (error) {
        console.error(
            "Get Pending Drivers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending drivers",
            error: error.message,
        });
    }
};


// ======================================================
// 2. GET ALL DRIVERS
// ======================================================

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find()
            .select("-Password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });

    } catch (error) {
        console.error(
            "Get All Drivers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch drivers",
            error: error.message,
        });
    }
};


// ======================================================
// 3. GET ALL VERIFIED DRIVERS
// ======================================================

exports.getVerifiedDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Verified",
        })
            .select("-Password")
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });

    } catch (error) {
        console.error(
            "Get Verified Drivers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch verified drivers",
            error: error.message,
        });
    }
};


// ======================================================
// 4. GET ALL REJECTED DRIVERS
// ======================================================

exports.getRejectedDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Rejected",
        })
            .select("-Password")
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });

    } catch (error) {
        console.error(
            "Get Rejected Drivers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch rejected drivers",
            error: error.message,
        });
    }
};


// ======================================================
// 5. VERIFY / REJECT DRIVER
// ======================================================

exports.updateVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;

        // ------------------------------------------
        // VALIDATE STATUS
        // ------------------------------------------

        if (
            !["Verified", "Rejected"].includes(
                verificationStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "verificationStatus must be either Verified or Rejected",
            });
        }

        // ------------------------------------------
        // FIND DRIVER
        // ------------------------------------------

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        // ------------------------------------------
        // ONLY PENDING DRIVER CAN BE VERIFIED/REJECTED
        // ------------------------------------------

        if (
            driver.verificationStatus !== "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Driver is already ${driver.verificationStatus.toLowerCase()}.`,
            });
        }

        // ------------------------------------------
        // UPDATE STATUS
        // ------------------------------------------

        driver.verificationStatus =
            verificationStatus;

        await driver.save();

        // ------------------------------------------
        // RESPONSE
        // ------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                verificationStatus === "Verified"
                    ? "Driver verified successfully"
                    : "Driver rejected successfully",

            driver: {
                _id: driver._id,

                driverReferenceId:
                    driver.driverReferenceId,

                Name: driver.Name,

                PhoneNumber:
                    driver.PhoneNumber,

                CountryCode:
                    driver.CountryCode,

                CountryIso:
                    driver.CountryIso,

                Email: driver.Email,

                CnicNumber:
                    driver.CnicNumber,

                License:
                    driver.License,

                verificationStatus:
                    driver.verificationStatus,

                updatedAt:
                    driver.updatedAt,
            },
        });

    } catch (error) {
        console.error(
            "Update Driver Verification Error:",
            error
        );

        // ------------------------------------------
        // INVALID MONGODB ID
        // ------------------------------------------

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID",
            });
        }

        // ------------------------------------------
        // GENERAL ERROR
        // ------------------------------------------

        return res.status(500).json({
            success: false,
            message:
                "Failed to update driver verification status",
            error: error.message,
        });
    }
};


// ======================================================
// 6. GET ALL PENDING VEHICLES
// ======================================================

exports.getPendingVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Pending",
        })
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });

    } catch (error) {
        console.error(
            "Get Pending Vehicles Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending vehicles",
            error: error.message,
        });
    }
};


// ======================================================
// 7. GET ALL VEHICLES
// ======================================================

exports.getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find()
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });

    } catch (error) {
        console.error(
            "Get All Vehicles Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch vehicles",
            error: error.message,
        });
    }
};
// 8. GET ALL VERIFIED VEHICLES
exports.getVerifiedVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Verified",
        })
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({ updatedAt: -1 });
        return res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });

    } catch (error) {
        console.error(
            "Get Verified Vehicles Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch verified vehicles",
            error: error.message,
        });
    }
};
// 9. GET ALL REJECTED VEHICLES
exports.getRejectedVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            verificationStatus: "Rejected",
        })
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles,
        });

    } catch (error) {
        console.error(
            "Get Rejected Vehicles Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch rejected vehicles",
            error: error.message,
        });
    }
};
// 10. VERIFY / REJECT VEHICLE
exports.updateVehicleVerificationStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { verificationStatus } =
            req.body;

        // VALIDATE STATUS
        if (
            !["Verified", "Rejected"].includes(
                verificationStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "verificationStatus must be either Verified or Rejected",
            });
        }

        // FIND VEHICLE
        const vehicle =
            await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        // ONLY PENDING VEHICLE CAN BE VERIFIED/REJECTED
        if (
            vehicle.verificationStatus !==
            "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Vehicle is already ${vehicle.verificationStatus.toLowerCase()}.`,
            });
        }

        // UPDATE STATUS
        vehicle.verificationStatus =
            verificationStatus;
        await vehicle.save();

        // RESPONSE
        return res.status(200).json({
            success: true,

            message:
                verificationStatus === "Verified"
                    ? "Vehicle verified successfully"
                    : "Vehicle rejected successfully",

            vehicle: {
                _id: vehicle._id,

                driver:
                    vehicle.driver,
                vehicleMake:
                    vehicle.vehicleMake,
                vehicleModel:
                    vehicle.vehicleModel,
                variant:
                    vehicle.variant,
                numberOfSeats:
                    vehicle.numberOfSeats,

                registrationNumber:
                    vehicle.registrationNumber,
                vehicleColor:
                    vehicle.vehicleColor,
                verificationStatus:
                    vehicle.verificationStatus,
                updatedAt:
                    vehicle.updatedAt,
            },
        });

    } catch (error) {
        console.error(
            "Update Vehicle Verification Error:",
            error
        );

        // INVALID MONGODB ID
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID",
            });
        }
        // GENERAL ERROR
        return res.status(500).json({
            success: false,
            message:
                "Failed to update vehicle verification status",
            error: error.message,
        });
    }
};