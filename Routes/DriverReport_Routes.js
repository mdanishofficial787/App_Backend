const express = require("express");
const router = express.Router();

const authMiddleware = require("../Middleware/Authr");
const upload = require("../Multer/DriverReport");

const {
    createDriverReport,
} = require("../Controller/DriverReportController");

// CREATE DRIVER ISSUE REPORT

router.post(
    "/",
    authMiddleware,
    upload.single("photo"),
    createDriverReport
);

module.exports = router;