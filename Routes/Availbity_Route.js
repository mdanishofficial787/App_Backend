const express = require("express");
const router = express.Router();
const Authr = require("../Middleware/Authr");

const {
    createAvailability,
    getAvailability,
    updateAvailabilitySlot,
    deleteAvailabilitySlot
} = require("../Controller/ManageAvailabilty");
const { addAvailabilitySlot } = require("../Controller/AddAvailabilitySlot");

router.post("/", Authr, createAvailability);
router.get("/", Authr, getAvailability);
router.post("/slot", Authr, addAvailabilitySlot);
router.patch("/slot/:slotId", Authr, updateAvailabilitySlot);
router.delete("/slot/:slotId", Authr, deleteAvailabilitySlot);

module.exports = router;