const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");

// AUTO LOGIN
const autoLogin = async (req, res) => {
    try {
        // GET DRIVER FROM AUTH MIDDLEWARE
        const driver = await Driver.findById(req.user.id);

        // DRIVER NOT FOUND
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        // CHECK DRIVER VERIFICATION
        if (driver.verificationStatus !== "Verified") {
            return res.status(403).json({
                success: false,
                isApproved: false,
                verificationStatus: driver.verificationStatus,
                message: "Your account is not verified. You cannot login."
            });
        }

        // FIND VEHICLE
        const vehicle = await Vehicle.findOne({
            driver: driver._id
        });

        // VEHICLE NOT FOUND
        if (!vehicle) {
            return res.status(403).json({
                success: false,
                isApproved: false,
                message: "Vehicle information not found. You cannot login."
            });
        }

        // CHECK VEHICLE VERIFICATION
        if (vehicle.verificationStatus !== "Verified") {
            return res.status(403).json({
                success: false,
                isApproved: false,
                verificationStatus: vehicle.verificationStatus,
                message: "Your vehicle is not verified. You cannot login."
            });
        }

        // REMOVE PASSWORD
        const driverResponse = driver.toObject();
        delete driverResponse.Password;

        // SUCCESS
        return res.status(200).json({
            success: true,
            message: "Auto login successful",
            isApproved: true,
            verificationStatus: driver.verificationStatus,
            vehicleVerificationStatus: vehicle.verificationStatus,
            rememberMe: driver.rememberMe,
            driver: driverResponse
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Auto login failed",
            error: error.message
        });
    }
};

module.exports = {
    autoLogin
};