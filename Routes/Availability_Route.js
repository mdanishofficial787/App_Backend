const express = require("express");

const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    createAvailability,
    getAvailability,
    updateAvailability,
    deleteTimeSlot,
} = require("../Controller/AvailabilityController");


// ==========================================
// 1. CREATE AVAILABILITY
// ==========================================

router.post(
    "/availability",
    Authr,
    createAvailability
);


// ==========================================
// 2. GET DRIVER AVAILABILITY
// ==========================================

router.get(
    "/availability",
    Authr,
    getAvailability
);


// ==========================================
// 3. UPDATE AVAILABILITY
// ==========================================

router.put(
    "/availability",
    Authr,
    updateAvailability
);


// ==========================================
// 4. DELETE SPECIFIC TIME SLOT
// ==========================================

router.delete(
    "/availability/:slotId",
    Authr,
    deleteTimeSlot
);


module.exports = router;