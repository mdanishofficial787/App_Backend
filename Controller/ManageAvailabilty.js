const Availability = require("../Schema/Availability");

const timeToMinutes = (time) => {
    const match = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(time);

    if (!match) {
        return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        return null;
    }

    if (period === "AM" && hours === 12) {
        hours = 0;
    }

    if (period === "PM" && hours !== 12) {
        hours += 12;
    }

    return hours * 60 + minutes;
};

const validateTimeSlots = (slots) => {
    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

    for (const slot of slots) {
        if (!slot.startTime) {
            return "Start time is required.";
        }

        if (!timeRegex.test(slot.startTime)) {
            return "Start time must be in HH:MM AM/PM format.";
        }

        const start = timeToMinutes(slot.startTime);

        if (slot.flexibleAfterDropoff === true) {
            continue;
        }

        if (!slot.endTime) {
            return "End time is required.";
        }

        if (!timeRegex.test(slot.endTime)) {
            return "End time must be in HH:MM AM/PM format.";
        }

        const end = timeToMinutes(slot.endTime);

        if (start >= end) {
            return "End time must be greater than start time.";
        }
    }

    return null;
};

const hasOverlap = (slots) => {
    const fixedSlots = slots
        .filter(slot => !slot.flexibleAfterDropoff)
        .sort(
            (a, b) =>
                timeToMinutes(a.startTime) -
                timeToMinutes(b.startTime)
        );

    for (let i = 0; i < fixedSlots.length - 1; i++) {
        const current = fixedSlots[i];
        const next = fixedSlots[i + 1];

        const currentEnd = timeToMinutes(current.endTime);
        const nextStart = timeToMinutes(next.startTime);

        if (currentEnd > nextStart) {
            return true;
        }
    }

    return false;
};

const createAvailability = async (req, res) => {
    try {
        const driverId = req.user.id;

        const {
            repeatSchedule,
            selectedDays,
            timeSlots,
            dayAvailability
        } = req.body;

        if (!repeatSchedule) {
            return res.status(400).json({
                success: false,
                message: "Repeat schedule is required."
            });
        }

        if (!["same", "different"].includes(repeatSchedule)) {
            return res.status(400).json({
                success: false,
                message: "Invalid repeat schedule."
            });
        }

        const existingAvailability = await Availability.findOne({
            driver: driverId
        });

        if (existingAvailability) {
            return res.status(400).json({
                success: false,
                message: "Availability already exists for this driver."
            });
        }

        if (repeatSchedule === "same") {
            if (!Array.isArray(selectedDays) || selectedDays.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Please select at least one day."
                });
            }

            if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one time slot is required."
                });
            }

            const timeError = validateTimeSlots(timeSlots);

            if (timeError) {
                return res.status(400).json({
                    success: false,
                    message: timeError
                });
            }

            if (hasOverlap(timeSlots)) {
                return res.status(400).json({
                    success: false,
                    message: "Availability slots cannot overlap."
                });
            }
        }

        if (repeatSchedule === "different") {
            if (!Array.isArray(dayAvailability) || dayAvailability.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Day-specific availability is required."
                });
            }

            for (const day of dayAvailability) {
                if (!day.day) {
                    return res.status(400).json({
                        success: false,
                        message: "Day is required."
                    });
                }

                if (!Array.isArray(day.timeSlots) || day.timeSlots.length === 0) {
                    continue;
                }

                const timeError = validateTimeSlots(day.timeSlots);

                if (timeError) {
                    return res.status(400).json({
                        success: false,
                        message: `${day.day}: ${timeError}`
                    });
                }

                if (hasOverlap(day.timeSlots)) {
                    return res.status(400).json({
                        success: false,
                        message: `${day.day}: Availability slots cannot overlap.`
                    });
                }
            }
        }

        const availability = await Availability.create({
            driver: driverId,
            repeatSchedule,
            selectedDays: repeatSchedule === "same" ? selectedDays : [],
            timeSlots: repeatSchedule === "same" ? timeSlots : [],
            dayAvailability: repeatSchedule === "different" ? dayAvailability : [],
            createdBy: driverId,
            updatedBy: null
        });

        return res.status(201).json({
            success: true,
            message: "Availability created successfully.",
            availability
        });
    } catch (error) {
        console.error("Create Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create availability.",
            error: error.message
        });
    }
};

const getAvailability = async (req, res) => {
    try {
        const driverId = req.user.id;

        const availability = await Availability.findOne({
            driver: driverId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Availability fetched successfully.",
            availability
        });
    } catch (error) {
        console.error("Get Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch availability.",
            error: error.message
        });
    }
};

const updateAvailabilitySlot = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { slotId } = req.params;

        const {
            startTime,
            endTime,
            flexibleAfterDropoff
        } = req.body;

        const availability = await Availability.findOne({
            driver: driverId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found."
            });
        }

        let slot = availability.timeSlots.id(slotId);
        let slotContainer = null;

        if (slot) {
            slotContainer = availability.timeSlots;
        }

        if (!slot) {
            for (const day of availability.dayAvailability) {
                slot = day.timeSlots.id(slotId);

                if (slot) {
                    slotContainer = day.timeSlots;
                    break;
                }
            }
        }

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found."
            });
        }

        const isFlexible = flexibleAfterDropoff === true;

        const timeError = validateTimeSlots([
            {
                startTime,
                endTime,
                flexibleAfterDropoff: isFlexible
            }
        ]);

        if (timeError) {
            return res.status(400).json({
                success: false,
                message: timeError
            });
        }

        const oldStartTime = slot.startTime;
        const oldEndTime = slot.endTime;
        const oldFlexible = slot.flexibleAfterDropoff;

        slot.startTime = startTime;
        slot.endTime = isFlexible ? null : endTime;
        slot.flexibleAfterDropoff = isFlexible;

        if (hasOverlap(slotContainer)) {
            slot.startTime = oldStartTime;
            slot.endTime = oldEndTime;
            slot.flexibleAfterDropoff = oldFlexible;

            return res.status(400).json({
                success: false,
                message: "Availability slots cannot overlap."
            });
        }

        availability.updatedBy = driverId;

        await availability.save();

        return res.status(200).json({
            success: true,
            message: "Time slot updated successfully.",
            availability
        });
    } catch (error) {
        console.error("Update Availability Slot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update time slot.",
            error: error.message
        });
    }
};

const deleteAvailabilitySlot = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { slotId } = req.params;

        const availability = await Availability.findOne({
            driver: driverId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found."
            });
        }

        let slot = availability.timeSlots.id(slotId);

        if (slot) {
            slot.deleteOne();
        } else {
            for (const day of availability.dayAvailability) {
                slot = day.timeSlots.id(slotId);

                if (slot) {
                    slot.deleteOne();
                    break;
                }
            }
        }

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found."
            });
        }

        availability.updatedBy = driverId;

        const hasAnySlots =
            availability.timeSlots.length > 0 ||
            availability.dayAvailability.some(
                day => day.timeSlots.length > 0
            );

        if (!hasAnySlots) {
            await Availability.findByIdAndDelete(availability._id);

            return res.status(200).json({
                success: true,
                message: "Time slot and availability deleted successfully."
            });
        }

        await availability.save();

        return res.status(200).json({
            success: true,
            message: "Time slot deleted successfully.",
            availability
        });
    } catch (error) {
        console.error("Delete Availability Slot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete time slot.",
            error: error.message
        });
    }
};

module.exports = {
    createAvailability,
    getAvailability,
    updateAvailabilitySlot,
    deleteAvailabilitySlot
};