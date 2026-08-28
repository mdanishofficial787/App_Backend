const Driver = require("../Schema/Driver");
const PasswordResetRequest = require("../Schema/Password");

const generateRequestId = () => {
    return `RESET-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
    )}`;
};

const forgotPasswordRequest = async (req, res) => {
    try {
        const { countryCode, PhoneNumber } = req.body;

        if (!countryCode || !PhoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Country code and phone number are required",
            });
        }

        const cleanCountryCode = countryCode
            .toString()
            .trim()
            .replace(/\s+/g, "");

        let cleanPhoneNumber = PhoneNumber
            .toString()
            .trim()
            .replace(/\s+/g, "");

        if (cleanPhoneNumber.startsWith(cleanCountryCode)) {
            cleanPhoneNumber = cleanPhoneNumber.slice(
                cleanCountryCode.length
            );
        }

        if (cleanPhoneNumber.startsWith("0")) {
            cleanPhoneNumber = cleanPhoneNumber.substring(1);
        }

        const driver = await Driver.findOne({
            CountryCode: cleanCountryCode,
            PhoneNumber: cleanPhoneNumber,
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "No driver account found with this phone number",
            });
        }

        const existingRequest = await PasswordResetRequest.findOne({
            driver: driver._id,
            status: "Pending",
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message:
                    "Your password reset request is already pending admin approval",
                requestId: existingRequest.requestId,
            });
        }

        let requestId;
        let requestExists = true;

        while (requestExists) {
            requestId = generateRequestId();

            requestExists = await PasswordResetRequest.findOne({
                requestId,
            });
        }

        const passwordResetRequest =
            await PasswordResetRequest.create({
                requestId,
                driver: driver._id,
                status: "Pending",
                requestedAt: new Date(),
                createdBy: driver._id,
                updatedBy: null,
                statusHistory: [
                    {
                        status: "Pending",
                        changedAt: new Date(),
                        changedBy: driver._id,
                        changedByModel: "Driver",
                        note: "Password reset request created",
                    },
                ],
            });

        return res.status(201).json({
            success: true,
            message:
                "Password reset request sent successfully. Please wait for admin approval.",
            data: {
                requestId: passwordResetRequest.requestId,
                driverId: driver._id,
                status: passwordResetRequest.status,
            },
        });
    } catch (error) {
        console.error("Forgot Password Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const checkPasswordResetStatus = async (req, res) => {
    try {
        const { countryCode, PhoneNumber } = req.body;

        if (!countryCode || !PhoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Country code and phone number are required",
            });
        }

        const cleanCountryCode = countryCode
            .toString()
            .trim()
            .replace(/\s+/g, "");

        let cleanPhoneNumber = PhoneNumber
            .toString()
            .trim()
            .replace(/\s+/g, "");

        if (cleanPhoneNumber.startsWith(cleanCountryCode)) {
            cleanPhoneNumber = cleanPhoneNumber.slice(
                cleanCountryCode.length
            );
        }

        if (cleanPhoneNumber.startsWith("0")) {
            cleanPhoneNumber = cleanPhoneNumber.substring(1);
        }

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

        const request = await PasswordResetRequest.findOne({
            driver: driver._id,
        }).sort({
            createdAt: -1,
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "No password reset request found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Password reset request status fetched successfully",
            data: {
                requestId: request.requestId,
                driverId: driver._id,
                status: request.status,
                requestedAt: request.requestedAt,
            },
        });
    } catch (error) {
        console.error("Check Password Reset Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    forgotPasswordRequest,
    checkPasswordResetStatus,
};