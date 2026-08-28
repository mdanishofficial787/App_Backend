const PasswordResetRequest = require("../Schema/Password");
exports.getPendingPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({
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
            message: "Failed to fetch pending password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 2. GET ALL PASSWORD RESET REQUESTS
// ======================================================

exports.getAllPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find()
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
            "Get All Password Reset Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 3. GET APPROVED PASSWORD RESET REQUESTS
// ======================================================

exports.getApprovedPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({
            status: "Approved",
        })
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({
                approvedAt: -1,
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
            message: "Failed to fetch approved password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 4. GET REJECTED PASSWORD RESET REQUESTS
// ======================================================

exports.getRejectedPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({
            status: "Rejected",
        })
            .populate(
                "driver",
                "Name PhoneNumber CountryCode CountryIso driverReferenceId"
            )
            .sort({
                rejectedAt: -1,
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
            message: "Failed to fetch rejected password reset requests",
            error: error.message,
        });
    }
};


// ======================================================
// 5. APPROVE / REJECT PASSWORD RESET REQUEST
// ======================================================

exports.updatePasswordResetStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        // CHECK REQUEST ID
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required",
            });
        }

        // CHECK STATUS
        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either Approved or Rejected",
            });
        }

        // FIND REQUEST USING requestId
        const request = await PasswordResetRequest.findOne({
            requestId: requestId,
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Password reset request not found",
            });
        }

        // ONLY PENDING REQUEST CAN BE UPDATED
        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Password reset request is already ${request.status.toLowerCase()}`,
            });
        }

        // UPDATE STATUS
        request.status = status;

        // APPROVED
        if (status === "Approved") {
            request.approvedAt = new Date();

            request.statusHistory.push({
                status: "Approved",
                changedAt: new Date(),
                changedBy: null,
                changedByModel: "Admin",
                note: "Password reset request approved by admin",
            });
        }

        // REJECTED
        if (status === "Rejected") {
            request.rejectedAt = new Date();

            request.statusHistory.push({
                status: "Rejected",
                changedAt: new Date(),
                changedBy: null,
                changedByModel: "Admin",
                note: "Password reset request rejected by admin",
            });
        }

        await request.save();

        return res.status(200).json({
            success: true,

            message:
                status === "Approved"
                    ? "Password reset request approved successfully"
                    : "Password reset request rejected successfully",

            request: {
                _id: request._id,
                requestId: request.requestId,
                driver: request.driver,
                status: request.status,
                approvedAt: request.approvedAt,
                rejectedAt: request.rejectedAt,
                usedAt: request.usedAt,
                createdBy: request.createdBy,
                statusHistory: request.statusHistory,
                updatedAt: request.updatedAt,
            },
        });

    } catch (error) {
        console.error(
            "Update Password Reset Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update password reset request status",
            error: error.message,
        });
    }
};