const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    createRidePreference,
    getRidePreferences,
    getRidePreferenceById,
    updateRidePreference,
    deleteRidePreference,
} = require("../Controller/RidetimeController");


// CREATE
router.post(
    "/ride-preference",
    Authr,
    createRidePreference
);


// GET ALL
router.get(
    "/ride-preference",
    Authr,
    getRidePreferences
);


// GET SINGLE
router.get(
    "/ride-preference/:id",
    Authr,
    getRidePreferenceById
);


// UPDATE / EDIT
router.put(
    "/ride-preference/:id",
    Authr,
    updateRidePreference
);


// DELETE
router.delete(
    "/ride-preference/:id",
    Authr,
    deleteRidePreference
);
module.exports = router;