const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    getSuggestedRoutes,
    saveDriverPreference
} = require("../Controller/ManageRoute");

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

// SAVE PREFERRED ROUTE
router.post(
    "/route-preference",
    Authr,
    saveDriverPreference
);

module.exports = router;