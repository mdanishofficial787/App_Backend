const Availability = require("../Schema/Availability");
// 1. CREATE AVAILABILITY
const createAvailability = async (req, res) => {
    try {
        const {
            repeatSchedule,
            selectedDays,
            timeSlots,
            flexibleAfterDropoff,
        } = req.body;
        // CHECK SELECTED DAYS
        if (!selectedDays || selectedDays.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one day",
            });
        }
        // CHECK TIME SLOTS
        if (!timeSlots || timeSlots.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please add at least one time slot",
            });
        }
        // CHECK IF AVAILABILITY ALREADY EXISTS
        const existingAvailability = await Availability.findOne({
            driver: req.user.id,
        });

        if (existingAvailability) {
            return res.status(400).json({
                success: false,
                message:
                    "Availability already exists. Please update it instead.",
            });
        }
        // CREATE AVAILABILITY
        const availability = new Availability({
            driver: req.user.id,
            repeatSchedule: repeatSchedule || "same",
            selectedDays,
            timeSlots,
            flexibleAfterDropoff:
                flexibleAfterDropoff || false,
        });
        // SAVE
        await availability.save();
        return res.status(201).json({
            success: true,
            message: "Availability created successfully",
            availability,
        });

    } catch (error) {
        console.log(
            "Create Availability Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });

    }
};
// 2. GET AVAILABILITY
const getAvailability = async (req, res) => {
    try {

        const availability = await Availability.findOne({
            driver: req.user.id,
        });
        // CHECK AVAILABILITY
        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Availability fetched successfully",
            availability,
        });

    } catch (error) {
        console.log(
            "Get Availability Error:",
            error
        );
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });

    }
};
// 3. UPDATE AVAILABILITY
const updateAvailability = async (req, res) => {
    try {

        const {
            repeatSchedule,
            selectedDays,
            timeSlots,
            flexibleAfterDropoff,
        } = req.body;

        // FIND AVAILABILITY
        const availability = await Availability.findOne({
            driver: req.user.id,
        });
        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found",
            });
        }
        // UPDATE ONLY PROVIDED FIELDS
        if (repeatSchedule !== undefined) {
            availability.repeatSchedule = repeatSchedule;
        }
        if (selectedDays !== undefined) {

            if (
                !Array.isArray(selectedDays) ||
                selectedDays.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please select at least one day",
                });
            }

            availability.selectedDays = selectedDays;
        }
        if (timeSlots !== undefined) {

            if (
                !Array.isArray(timeSlots) ||
                timeSlots.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please add at least one time slot",
                });
            }
            availability.timeSlots = timeSlots;
        }
        if (flexibleAfterDropoff !== undefined) {
            availability.flexibleAfterDropoff =
                flexibleAfterDropoff;
        }
        // SAVE UPDATED DATA
        await availability.save();
        return res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            availability,
        });

    } catch (error) {
        console.log(
            "Update Availability Error:",
            error
        );
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });

    }
};
// 4. DELETE SPECIFIC TIME SLOT
const deleteTimeSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        // FIND AVAILABILITY
        const availability = await Availability.findOne({
            driver: req.user.id,
        });
        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found",
            });
        }
        // FIND TIME SLOT
        const timeSlot = availability.timeSlots.id(
            slotId
        );
        if (!timeSlot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found",
            });
        }
        // PREVENT DELETING LAST SLOT
        if (availability.timeSlots.length === 1) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one time slot is required",
            });
        }
        // DELETE TIME SLOT
        availability.timeSlots.pull(slotId);
        await availability.save();
        return res.status(200).json({
            success: true,
            message: "Time slot deleted successfully",
            availability,
        });

    } catch (error) {
        console.log(
            "Delete Time Slot Error:",
            error
        );
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });

    }
};
// EXPORT ALL CONTROLLERS

module.exports = {
    createAvailability,
    getAvailability,
    updateAvailability,
    deleteTimeSlot,
};