const Driver = require("../Schema/Driver");

// 1. GET PENDING NEW DRIVERS
exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: "Pending",
            updateRequestStatus: "None",
        })
            .select("-Password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });
    } catch (error) {
        console.error("Get Pending Drivers Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending drivers",
        });
    }
};

// 2. GET ALL DRIVERS
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find()
            .select("-Password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });
    } catch (error) {
        console.error("Get All Drivers Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch drivers",
        });
    }
};

// 3. VERIFY / REJECT NEW DRIVER
exports.updateVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;

        if (!["Verified", "Rejected"].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Verified or Rejected",
            });
        }

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        if (driver.verificationStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Driver is already processed",
            });
        }

        driver.verificationStatus = verificationStatus;
        await driver.save();

        const result = driver.toObject();
        delete result.Password;

        res.status(200).json({
            success: true,
            message:
                verificationStatus === "Verified"
                    ? "Driver verified successfully"
                    : "Driver rejected successfully",
            driver: result,
        });
    } catch (error) {
        console.error("Update Driver Verification Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update driver status",
        });
    }
};

// 4. GET PENDING DRIVER UPDATES
exports.getPendingDriverUpdates = async (req, res) => {
    try {
        const drivers = await Driver.find({
            updateRequestStatus: "Pending",
        })
            .select("-Password")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });
    } catch (error) {
        console.error("Get Pending Updates Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch update requests",
        });
    }
};

// 5. APPROVE DRIVER UPDATE
exports.approveDriverUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        if (
            driver.updateRequestStatus !== "Pending" ||
            !driver.pendingUpdate
        ) {
            return res.status(400).json({
                success: false,
                message: "No pending update request",
            });
        }

        const allowedFields = [
            "Name",
            "PhoneNumber",
            "CountryCode",
            "CountryIso",
            "Email",
            "CnicNumber",
            "CnicFront",
            "CnicBack",
            "License",
            "LicenseExpiryDate",
            "LicenseFront",
            "LicenseBack",
            "driverPhoto",
            "backgroundCheckConsent",
        ];

        allowedFields.forEach((field) => {
            if (driver.pendingUpdate[field] !== undefined) {
                driver[field] = driver.pendingUpdate[field];
            }
        });

        driver.pendingUpdate = null;
        driver.updateRequestStatus = "Approved";
        driver.updateRequired = false;
        driver.expiryWarning = null;

        await driver.save();

        const result = driver.toObject();
        delete result.Password;

        res.status(200).json({
            success: true,
            message: "Driver update approved successfully",
            driver: result,
        });
    } catch (error) {
        console.error("Approve Driver Update Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Updated driver information already exists.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to approve driver update",
        });
    }
};

// 6. REJECT DRIVER UPDATE
exports.rejectDriverUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminMessage } = req.body;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        if (driver.updateRequestStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "No pending update request",
            });
        }

        driver.pendingUpdate = null;
        driver.updateRequestStatus = "Rejected";
        driver.updateRequired = true;
        driver.expiryWarning =
            adminMessage ||
            "Your update request was rejected. Please update your information.";

        await driver.save();

        res.status(200).json({
            success: true,
            message: "Driver update rejected successfully",
        });
    } catch (error) {
        console.error("Reject Driver Update Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject driver update",
        });
    }
};

// 7. MARK DRIVER UPDATE REQUIRED
exports.markDriverUpdateRequired = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        driver.updateRequired = true;
        driver.expiryWarning =
            message ||
            "Your license has expired. Please update your license.";

        await driver.save();

        res.status(200).json({
            success: true,
            message: "Driver has been asked to update information",
        });
    } catch (error) {
        console.error("Mark Driver Update Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to request driver update",
        });
    }
};