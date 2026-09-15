const Route = require("../Schema/RideMatch");
const DriverPreference = require("../Schema/DriverRoutePreference");

// GET SUGGESTED ROUTES
const getSuggestedRoutes = async (req, res) => {
    try {
        const routes = await Route.find()
            .sort({ createdAt: -1 })
            .lean();

        const formattedRoutes = routes.map((route) => {
            const timeParts = route.timeSlot.split(" - ");

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

                startTime: timeParts[0],
                endTime: timeParts[1],

                customerRequests: route.activeRequestsCount || 0
            };
        });

        return res.status(200).json({
            success: true,
            message: "Route suggestions retrieved successfully",
            count: formattedRoutes.length,
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
// SAVE PREFERRED ROUTE
// ==========================================

const saveDriverPreference = async (req, res) => {
    try {
        const driverId = req.user.id;

        const {
            preferredRouteId,
            preferredTimeSlot,
            startPoint,
            endPoint
        } = req.body;

        if (
            !preferredRouteId ||
            !preferredTimeSlot ||
            !startPoint ||
            !endPoint
        ) {
            return res.status(400).json({
                success: false,
                message: "All preference fields are required"
            });
        }

        const route = await Route.findById(preferredRouteId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Selected route not found"
            });
        }

        const savedPreference = await DriverPreference.findOneAndUpdate(
            { driver: driverId },
            {
                driver: driverId,
                preferredRoute: preferredRouteId,
                preferredTimeSlot,
                startPoint,
                endPoint
            },
            {
                new: true,
                upsert: true
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
    saveDriverPreference
};