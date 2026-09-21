const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    getSuggestedRoutes,
    saveDriverPreference,
    getDriverPreference
} = require("../Controller/MatchRoute");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "MatchRoute is working"
    });
});

// GET SUGGESTED ROUTES
router.get(
    "/route-suggestions",
    Authr,
    getSuggestedRoutes
);

// GET DRIVER PREFERENCE
router.get(
    "/route-preference",
    Authr,
    getDriverPreference
);

// SAVE PREFERRED ROUTE
router.post(
    "/route-preference",
    Authr,
    saveDriverPreference
);

module.exports = router;