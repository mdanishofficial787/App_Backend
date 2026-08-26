const PasswordResetRequest = require("../Schema/Password");

// ======================================================
// 1. GET ALL PENDING PASSWORD RESET REQUESTS
// ======================================================

exports.getPendingPasswordResetRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await PasswordResetRequest.find({
                status: "Pending",
            })
                .populate(
                    "driver",
                    "Name PhoneNumber CountryCode CountryIso driverReferenceId"
                )
                .populate(
                    "createdBy",
                    "Name PhoneNumber"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests,
        });

    } catch (error) {
        console.error(
            "Get Pending Password Reset Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch pending password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 2. GET ALL PASSWORD RESET REQUESTS
// ======================================================

exports.getAllPasswordResetRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await PasswordResetRequest.find()
                .populate(
                    "driver",
                    "Name PhoneNumber CountryCode CountryIso driverReferenceId"
                )
                .populate(
                    "createdBy",
                    "Name PhoneNumber"
                )
                .populate(
                    "updatedBy",
                    "Name Email"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests,
        });

    } catch (error) {
        console.error(
            "Get All Password Reset Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 3. GET ALL APPROVED PASSWORD RESET REQUESTS
// ======================================================

exports.getApprovedPasswordResetRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await PasswordResetRequest.find({
                status: "Approved",
            })
                .populate(
                    "driver",
                    "Name PhoneNumber CountryCode CountryIso driverReferenceId"
                )
                .populate(
                    "updatedBy",
                    "Name Email"
                )
                .sort({
                    updatedAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests,
        });

    } catch (error) {
        console.error(
            "Get Approved Password Reset Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch approved password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 4. GET ALL REJECTED PASSWORD RESET REQUESTS
// ======================================================

exports.getRejectedPasswordResetRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await PasswordResetRequest.find({
                status: "Rejected",
            })
                .populate(
                    "driver",
                    "Name PhoneNumber CountryCode CountryIso driverReferenceId"
                )
                .populate(
                    "updatedBy",
                    "Name Email"
                )
                .sort({
                    updatedAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests,
        });

    } catch (error) {
        console.error(
            "Get Rejected Password Reset Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch rejected password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 5. APPROVE / REJECT PASSWORD RESET REQUEST
// ======================================================

exports.updatePasswordResetStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ==================================================
        // VALIDATE STATUS
        // ==================================================

        if (
            !["Approved", "Rejected"].includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "status must be either Approved or Rejected",
            });
        }

        // ==================================================
        // FIND REQUEST
        // ==================================================

        const request =
            await PasswordResetRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Password reset request not found",
            });
        }

        // ==================================================
        // ONLY PENDING REQUEST CAN BE UPDATED
        // ==================================================

        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Password reset request is already ${request.status.toLowerCase()}.`,
            });
        }

        // ==================================================
        // UPDATE STATUS
        // ==================================================

        request.status = status;

        // No Admin Auth for now
        request.updatedBy = null;

        // ==================================================
        // APPROVED / REJECTED DATE
        // ==================================================

        if (status === "Approved") {
            request.approvedAt = new Date();
        }

        if (status === "Rejected") {
            request.rejectedAt = new Date();
        }

        await request.save();

        // ==================================================
        // SUCCESS
        // ==================================================

        return res.status(200).json({
            success: true,

            message:
                status === "Approved"
                    ? "Password reset request approved successfully"
                    : "Password reset request rejected successfully",

            request: {
                _id: request._id,

                driver: request.driver,

                status: request.status,

                createdBy: request.createdBy,

                updatedBy: request.updatedBy,

                approvedAt: request.approvedAt,

                rejectedAt: request.rejectedAt,

                updatedAt: request.updatedAt,
            },
        });

    } catch (error) {
        console.error(
            "Update Password Reset Status Error:",
            error
        );

        // Invalid MongoDB ID
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid password reset request ID",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update password reset request status",
            error: error.message,
        });
    }
};