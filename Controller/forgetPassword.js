const Driver = require("../Schema/Driver");
const PasswordResetRequest = require("../Schema/Password");

// ======================================================
// 1. DRIVER SEND PASSWORD RESET REQUEST
// ======================================================

const forgotPasswordRequest = async (req, res) => {
    try {
        const {
            countryCode,
            PhoneNumber,
        } = req.body;

        // VALIDATION
        if (!countryCode || !PhoneNumber) {
            return res.status(400).json({
                success: false,
                message:
                    "Country code and phone number are required",
            });
        }

        // CLEAN COUNTRY CODE
        const cleanCountryCode = countryCode
            .toString()
            .trim()
            .replace(/\s+/g, "");

        // CLEAN PHONE NUMBER
        let cleanPhoneNumber = PhoneNumber
            .toString()
            .trim()
            .replace(/\s+/g, "");

        // If number starts with country code
        // +923129582347
        // convert to 3129582347

        if (
            cleanPhoneNumber.startsWith(
                cleanCountryCode
            )
        ) {
            cleanPhoneNumber =
                cleanPhoneNumber.slice(
                    cleanCountryCode.length
                );
        }

        // If number starts with 0
        // 03129582347
        // convert to 3129582347

        if (cleanPhoneNumber.startsWith("0")) {
            cleanPhoneNumber =
                cleanPhoneNumber.substring(1);
        }

        // ======================================================
        // FIND DRIVER
        // ======================================================

        const driver = await Driver.findOne({
            CountryCode: cleanCountryCode,
            PhoneNumber: cleanPhoneNumber,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message:
                    "No driver account found with this phone number",
            });
        }

        // ======================================================
        // CHECK PENDING REQUEST
        // ======================================================

        const existingRequest =
            await PasswordResetRequest.findOne({
                driver: driver._id,
                status: "Pending",
            });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message:
                    "Your password reset request is already pending admin approval",
            });
        }

        // ======================================================
        // CREATE REQUEST
        // ======================================================

        const passwordResetRequest =
            await PasswordResetRequest.create({
                driver: driver._id,

                status: "Pending",

                requestedAt: new Date(),

                createdBy: driver._id,

                updatedBy: null,
            });

        // ======================================================
        // SUCCESS
        // ======================================================

        return res.status(201).json({
            success: true,

            message:
                "Password reset request sent successfully. Please wait for admin approval.",

            data: {
                requestId:
                    passwordResetRequest._id,

                driverId:
                    driver._id,

                status:
                    passwordResetRequest.status,
            },
        });

    } catch (error) {
        console.error(
            "Forgot Password Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ======================================================
// 2. CHECK PASSWORD RESET REQUEST STATUS
// ======================================================

const checkPasswordResetStatus = async (req, res) => {
    try {
        const {
            countryCode,
            PhoneNumber,
        } = req.body;

        // VALIDATION
        if (!countryCode || !PhoneNumber) {
            return res.status(400).json({
                success: false,
                message:
                    "Country code and phone number are required",
            });
        }

        // CLEAN COUNTRY CODE
        const cleanCountryCode = countryCode
            .toString()
            .trim()
            .replace(/\s+/g, "");

        // CLEAN PHONE NUMBER
        let cleanPhoneNumber = PhoneNumber
            .toString()
            .trim()
            .replace(/\s+/g, "");

        // Remove country code if included
        if (
            cleanPhoneNumber.startsWith(
                cleanCountryCode
            )
        ) {
            cleanPhoneNumber =
                cleanPhoneNumber.slice(
                    cleanCountryCode.length
                );
        }

        // Remove starting 0
        if (cleanPhoneNumber.startsWith("0")) {
            cleanPhoneNumber =
                cleanPhoneNumber.substring(1);
        }

        // ======================================================
        // FIND DRIVER
        // ======================================================

        const driver = await Driver.findOne({
            CountryCode: cleanCountryCode,
            PhoneNumber: cleanPhoneNumber,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        // ======================================================
        // GET LATEST REQUEST
        // ======================================================

        const request =
            await PasswordResetRequest.findOne({
                driver: driver._id,
            }).sort({
                createdAt: -1,
            });

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "No password reset request found",
            });
        }

        // ======================================================
        // SUCCESS
        // ======================================================

        return res.status(200).json({
            success: true,

            message:
                "Password reset request status fetched successfully",

            status: request.status,

            requestId:
                request._id,

            driverId:
                driver._id,
        });

    } catch (error) {
        console.error(
            "Check Password Reset Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    forgotPasswordRequest,
    checkPasswordResetStatus,
};