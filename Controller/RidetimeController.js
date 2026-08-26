const RidePreference = require("../Schema/RidePreference");
// CREATE RIDE PREFERENCE
const createRidePreference = async (req, res) => {
    try {
        const { startLocation, endLocation, preferredTime } = req.body;

        // CHECK START LOCATION
        if (
            !startLocation ||
            startLocation.latitude === undefined ||
            startLocation.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Start location is required",
            });
        }

        // CHECK END LOCATION
        if (
            !endLocation ||
            endLocation.latitude === undefined ||
            endLocation.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "End location is required",
            });
        }

        // VALIDATE PREFERRED TIME
        if (
            !preferredTime ||
            typeof preferredTime !== "string" ||
            !preferredTime.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Preferred time is required",
            });
        }

        const driverId = req.user.id;
        // CREATE
        const preference = await RidePreference.create({
            driver: driverId,
            startLocation: {
                latitude: Number(startLocation.latitude),
                longitude: Number(startLocation.longitude),
                address: startLocation.address?.trim() || null,
            },
            endLocation: {
                latitude: Number(endLocation.latitude),
                longitude: Number(endLocation.longitude),
                address: endLocation.address?.trim() || null,
            },
            preferredTime: preferredTime.trim(),
            createdBy: driverId,
            updatedBy: driverId,
        });
        return res.status(201).json({
            success: true,
            message: "Ride preference created successfully",
            data: preference,
        });

    } catch (error) {
        console.error("CREATE RIDE PREFERENCE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create ride preference",
            error: error.message,
        });
    }
};
// GET ALL RIDE PREFERENCES OF LOGGED-IN DRIVER
const getRidePreferences = async (req, res) => {
    try {
        const driverId = req.user.id;
        const preferences = await RidePreference.find({
            driver: driverId,
        }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: preferences.length,
            data: preferences,
        });

    } catch (error) {
        console.error("GET RIDE PREFERENCES ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ride preferences",
            error: error.message,
        });
    }
};
// GET SINGLE RIDE PREFERENCE
const getRidePreferenceById = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;
        const preference = await RidePreference.findOne({
            _id: id,
            driver: driverId,
        });
        if (!preference) {
            return res.status(404).json({
                success: false,
                message: "Ride preference not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: preference,
        });

    } catch (error) {
        console.error("GET SINGLE RIDE PREFERENCE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ride preference",
            error: error.message,
        });
    }
};
// UPDATE / EDIT RIDE PREFERENCE
const updateRidePreference = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;
        const preference = await RidePreference.findOne({
            _id: id,
            driver: driverId,
        });
        if (!preference) {
            return res.status(404).json({
                success: false,
                message: "Ride preference not found",
            });
        }
        const { startLocation, endLocation, preferredTime } = req.body;
        // UPDATE START LOCATION
        if (startLocation) {
            if (
                startLocation.latitude === undefined ||
                startLocation.longitude === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Start location must contain latitude and longitude",
                });
            }
            preference.startLocation = {
                latitude: Number(startLocation.latitude),
                longitude: Number(startLocation.longitude),
                address: startLocation.address?.trim() || null,
            };
        }
        // UPDATE END LOCATION
        if (endLocation) {
            if (
                endLocation.latitude === undefined ||
                endLocation.longitude === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "End location must contain latitude and longitude",
                });
            }
            preference.endLocation = {
                latitude: Number(endLocation.latitude),
                longitude: Number(endLocation.longitude),
                address: endLocation.address?.trim() || null,
            };
        }

        // UPDATE PREFERRED TIME
        if (preferredTime !== undefined) {
            if (
                typeof preferredTime !== "string" ||
                !preferredTime.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Preferred time cannot be empty",
                });
            }
            preference.preferredTime = preferredTime.trim();
        }
        preference.updatedBy = driverId;
        await preference.save();
        return res.status(200).json({
            success: true,
            message: "Ride preference updated successfully",
            data: preference,
        });
    } catch (error) {
        console.error("UPDATE RIDE PREFERENCE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update ride preference",
            error: error.message,
        });
    }
};
// DELETE RIDE PREFERENCE
const deleteRidePreference = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;
        const preference = await RidePreference.findOneAndDelete({
            _id: id,
            driver: driverId,
        });
        if (!preference) {
            return res.status(404).json({
                success: false,
                message: "Ride preference not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Ride preference deleted successfully",
        });

    } catch (error) {
        console.error("DELETE RIDE PREFERENCE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete ride preference",
            error: error.message,
        });
    }
};
// EXPORTS
module.exports = {
    createRidePreference,
    getRidePreferences,
    getRidePreferenceById,
    updateRidePreference,
    deleteRidePreference,
};