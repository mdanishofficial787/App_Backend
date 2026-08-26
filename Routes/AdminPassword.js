const express = require("express");

const router = express.Router();

const {
    getPendingPasswordResetRequests,
    getAllPasswordResetRequests,
    getApprovedPasswordResetRequests,
    getRejectedPasswordResetRequests,
    updatePasswordResetStatus,
} = require("../Controller/AdminPassword");


// 1. Pending
router.get(
    "/password-reset/pending",
    getPendingPasswordResetRequests
);


// 2. All
router.get(
    "/password-reset",
    getAllPasswordResetRequests
);


// 3. Approved
router.get(
    "/password-reset/approved",
    getApprovedPasswordResetRequests
);


// 4. Rejected
router.get(
    "/password-reset/rejected",
    getRejectedPasswordResetRequests
);


// 5. Approve / Reject
router.patch(
    "/password-reset/:id/status",
    updatePasswordResetStatus
);


module.exports = router;