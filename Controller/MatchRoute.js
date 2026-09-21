const mongoose = require("mongoose");
const Route = require("../Schema/RouteMatch");
const DriverPreference = require("../Schema/DriverRoutePreference");

// ==========================================
// GET SUGGESTED ROUTES
// ==========================================

const getSuggestedRoutes = async (req, res) => {
    try {
        const driverId = req.user?.id;

        // Fetch driver's current preference if available
        let currentPreference = null;
        if (driverId) {
            currentPreference = await DriverPreference.findOne({ driver: driverId }).lean();
        }

        const preferredRouteIdStr = currentPreference?.preferredRoute?.toString();

        const routes = await Route.find()
            .sort({ createdAt: -1 })
            .lean();

        const formattedRoutes = routes.map((route) => {
            const isPreferred = preferredRouteIdStr ? route._id.toString() === preferredRouteIdStr : false;

            return {
                routeId: route._id,

                routeName: route.routeName,

                startPoint: {
                    address: route.pickupPoint.address,
                    latitude: route.pickupPoint.latitude,
                    longitude: route.pickupPoint.longitude
                },

                endPoint: {
                    address: route.dropPoint.address,
                    latitude: route.dropPoint.latitude,
                    longitude: route.dropPoint.longitude
                },

                // Optional
                startTime: route.startTime || null,

                // Optional
                endTime: route.endTime || null,

                customerRequests: route.activeRequestsCount || 0,

                isPreferred: isPreferred
            };
        });

        return res.status(200).json({
            success: true,
            message: "Route suggestions retrieved successfully",
            count: formattedRoutes.length,
            currentPreference: currentPreference ? {
                preferredRouteId: currentPreference.preferredRoute,
                startPoint: currentPreference.startPoint,
                endPoint: currentPreference.endPoint
            } : null,
            routes: formattedRoutes
        });

    } catch (error) {
        console.error("Get Suggested Routes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve route suggestions",
            error: error.message
        });
    }
};


// ==========================================
// GET DRIVER PREFERENCE
// ==========================================

const getDriverPreference = async (req, res) => {
    try {
        const driverId = req.user.id;

        const preference = await DriverPreference.findOne({ driver: driverId })
            .populate("preferredRoute")
            .lean();

        return res.status(200).json({
            success: true,
            message: preference ? "Driver preference retrieved successfully" : "No preference found",
            data: preference || null
        });

    } catch (error) {
        console.error("Get Driver Preference Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve driver preference",
            error: error.message
        });
    }
};


// ==========================================
// SAVE PREFERRED ROUTE
// ==========================================

const saveDriverPreference = async (req, res) => {
    try {
        const driverId = req.user.id;

        const {
            preferredRouteId,
            startPoint,
            endPoint
        } = req.body;


        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (!preferredRouteId || !startPoint || !endPoint) {
            return res.status(400).json({
                success: false,
                message: "Preferred route, start point and end point are required"
            });
        }


        // ==========================================
        // VALIDATE ROUTE ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(preferredRouteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid preferred route ID"
            });
        }


        // ==========================================
        // CHECK SELECTED ROUTE
        // ==========================================

        const route = await Route.findById(preferredRouteId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Selected route not found"
            });
        }


        // ==========================================
        // SAVE / UPDATE DRIVER PREFERENCE
        // ==========================================

        const savedPreference = await DriverPreference.findOneAndUpdate(
            {
                driver: driverId
            },
            {
                driver: driverId,
                preferredRoute: preferredRouteId,
                startPoint: startPoint,
                endPoint: endPoint
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );


        return res.status(200).json({
            success: true,
            message: "Preferred route saved successfully",
            data: savedPreference
        });

    } catch (error) {
        console.error("Save Driver Preference Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save preferred route",
            error: error.message
        });
    }
};


module.exports = {
    getSuggestedRoutes,
    getDriverPreference,
    saveDriverPreference
};