const Availability = require("../Schema/Availability");
const timeToMinutes = (time) => {
    const [timePart, period] = time.trim().split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    return hours * 60 + minutes;
};

const hasOverlap = (slots) => {
    const sortedSlots = [...slots].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        if (current.flexibleAfterDropoff) continue;

        const currentEnd = current.endTime
            ? timeToMinutes(current.endTime)
            : null;

        const nextStart = timeToMinutes(next.startTime);

        if (currentEnd > nextStart) return true;
    }

    return false;
};

const addAvailabilitySlot = async (req, res) => {
    try {
        const driverId = req.user.id;
        const {
            days,
            startTime,
            endTime,
            flexibleAfterDropoff
        } = req.body;

        const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        if (!Array.isArray(days) || days.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one day."
            });
        }

        for (const day of days) {
            if (!validDays.includes(day)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid day: ${day}`
                });
            }
        }

        const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

        if (!startTime || !timeRegex.test(startTime)) {
            return res.status(400).json({
                success: false,
                message: "Start time must be in HH:MM AM/PM format."
            });
        }

        const isFlexible = flexibleAfterDropoff === true;

        if (!isFlexible) {
            if (!endTime || !timeRegex.test(endTime)) {
                return res.status(400).json({
                    success: false,
                    message: "End time must be in HH:MM AM/PM format."
                });
            }

            if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
                return res.status(400).json({
                    success: false,
                    message: "End time must be greater than start time."
                });
            }
        }

        const availability = await Availability.findOne({
            driver: driverId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found."
            });
        }

        const newSlot = {
            startTime,
            endTime: isFlexible ? null : endTime,
            flexibleAfterDropoff: isFlexible
        };
        if (availability.repeatSchedule === "same") {
            for (const day of days) {
                if (!availability.selectedDays.includes(day)) {
                    return res.status(400).json({
                        success: false,
                        message: `${day} is not selected in availability.`
                    });
                }
            }

            const slots = [
                ...availability.timeSlots,
                newSlot
            ];

            if (hasOverlap(slots)) {
                return res.status(400).json({
                    success: false,
                    message: "Availability slots cannot overlap."
                });
            }

            availability.timeSlots.push(newSlot);
        }

        if (availability.repeatSchedule === "different") {
            for (const dayName of days) {
                const day = availability.dayAvailability.find(
                    item => item.day === dayName
                );

                if (!day) {
                    return res.status(400).json({
                        success: false,
                        message: `${dayName} is not available in the schedule.`
                    });
                }

                const slots = [
                    ...day.timeSlots,
                    newSlot
                ];

                if (hasOverlap(slots)) {
                    return res.status(400).json({
                        success: false,
                        message: `${dayName}: Availability slots cannot overlap.`
                    });
                }
            }

            for (const dayName of days) {
                const day = availability.dayAvailability.find(
                    item => item.day === dayName
                );

                day.timeSlots.push({
                    startTime,
                    endTime: isFlexible ? null : endTime,
                    flexibleAfterDropoff: isFlexible
                });
            }
        }

        availability.updatedBy = driverId;

        await availability.save();

        return res.status(200).json({
            success: true,
            message: "New time slot added successfully.",
            availability
        });
    } catch (error) {
        console.error("Add Availability Slot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add new time slot.",
            error: error.message
        });
    }
};

module.exports = {
    addAvailabilitySlot
};