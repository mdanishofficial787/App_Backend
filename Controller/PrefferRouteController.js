const PreferredRoute = require("../Schema/RidePreference");
const createPreferredRoute = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { startLocation, endLocation, preferredTime } = req.body;

        const preferredRoute = new PreferredRoute({
            driver: driverId,
            startLocation,
            endLocation,
            preferredTime,
            createdBy: driverId,
            updatedBy: driverId
        });

        await preferredRoute.save();
        return res.status(201).json({
            success: true,
            message: "Preferred route created successfully",
            data: preferredRoute
        });
    } catch (error) {
        console.error("Create Preferred Route Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create preferred route",
            error: error.message
        });
    }
};

const getPreferredRoutes = async (req, res) => {
    try {
        const driverId = req.user.id;

        const routes = await PreferredRoute.find({
            driver: driverId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Preferred routes fetched successfully",
            count: routes.length,
            data: routes
        });
    } catch (error) {
        console.error("Get Preferred Routes Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch preferred routes",
            error: error.message
        });
    }
};

const getPreferredRouteById = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;

        const route = await PreferredRoute.findOne({
            _id: id,
            driver: driverId
        });

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Preferred route not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Preferred route fetched successfully",
            data: route
        });
    } catch (error) {
        console.error("Get Preferred Route By ID Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch preferred route",
            error: error.message
        });
    }
};

const updatePreferredRoute = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;
        const { startLocation, endLocation, preferredTime } = req.body;

        const route = await PreferredRoute.findOne({
            _id: id,
            driver: driverId
        });

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Preferred route not found"
            });
        }

        route.startLocation = startLocation;
        route.endLocation = endLocation;
        route.preferredTime = preferredTime;
        route.updatedBy = driverId;

        await route.save();

        return res.status(200).json({
            success: true,
            message: "Preferred route updated successfully",
            data: route
        });
    } catch (error) {
        console.error("Update Preferred Route Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update preferred route",
            error: error.message
        });
    }
};

const deletePreferredRoute = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { id } = req.params;

        const route = await PreferredRoute.findOneAndDelete({
            _id: id,
            driver: driverId
        });

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Preferred route not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Preferred route deleted successfully"
        });
    } catch (error) {
        console.error("Delete Preferred Route Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete preferred route",
            error: error.message
        });
    }
};

module.exports = {
    createPreferredRoute,
    getPreferredRoutes,
    getPreferredRouteById,
    updatePreferredRoute,
    deletePreferredRoute
};