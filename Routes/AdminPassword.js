const express = require("express");

const router = express.Router();

const {
    getPendingPasswordResetRequests,
    getAllPasswordResetRequests,
    getApprovedPasswordResetRequests,
    getRejectedPasswordResetRequests,
    updatePasswordResetStatus,
} = require("../Controller/AdminPassword");

// 1. GET PENDING REQUESTS

router.get(
    "/password-reset/pending",
    getPendingPasswordResetRequests
);

// 2. GET ALL REQUESTS

router.get(
    "/password-reset",
    getAllPasswordResetRequests
);

// 3. GET APPROVED REQUESTS

router.get(
    "/password-reset/approved",
    getApprovedPasswordResetRequests
);

// 4. GET REJECTED REQUESTS

router.get(
    "/password-reset/rejected",
    getRejectedPasswordResetRequests
);

// 5. APPROVE / REJECT REQUEST

router.patch(
    "/password-reset/:requestId/status",
    updatePasswordResetStatus
);

module.exports = router;