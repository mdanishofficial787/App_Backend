const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");
console.log("🔥🔥🔥 NEW LOGIN.JS LOADED 🔥🔥🔥");

// ======================================================
// DRIVER LOGIN
// ======================================================

const loginDriver = async (req, res) => {
    try {

        const {
            CountryCode,
            PhoneNumber,
            Password,
        } = req.body;


        // ======================================================
        // 1. VALIDATION
        // ======================================================

        if (
            !CountryCode ||
            !PhoneNumber ||
            !Password
        ) {


            return res.status(400).json({
                success: false,
                message:
                    "Country code, phone number and password are required",
            });
        }

        // ======================================================
        // 2. CLEAN COUNTRY CODE
        // ======================================================
        const cleanCountryCode =
            CountryCode
                .toString()
                .trim()
                .replace(/\s+/g, "");


        // 3. CLEAN PHONE NUMBER
        let cleanPhoneNumber =
            PhoneNumber
                .toString()
                .trim()
                .replace(/\s+/g, "");

        console.log(
            "Phone before cleaning:",
            cleanPhoneNumber
        );


        // Remove country code if included
        if (
            cleanPhoneNumber.startsWith(
                cleanCountryCode
            )
        ) {

            cleanPhoneNumber =
                cleanPhoneNumber.slice(
                    cleanCountryCode.length
                );

            console.log(
                "CountryCode removed from phone:",
                cleanPhoneNumber
            );
        }


        // Remove leading 0
        if (
            cleanPhoneNumber.startsWith("0")
        ) {

            cleanPhoneNumber =
                cleanPhoneNumber.substring(1);

            console.log(
                "Leading 0 removed:",
                cleanPhoneNumber
            );
        }

        // ======================================================
        // 4. FIND DRIVER
        // ======================================================

        const driver =
            await Driver.findOne({
                CountryCode:
                    cleanCountryCode,

                PhoneNumber:
                    cleanPhoneNumber,
            });


        if (!driver) {

            console.log(
                " DRIVER NOT FOUND"
            );

            console.log(
                "Search:",
                {
                    CountryCode:
                        cleanCountryCode,

                    PhoneNumber:
                        cleanPhoneNumber,
                }
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid phone number or password",
            });
        }


        console.log(
            " DRIVER FOUND"
        );

        console.log(
            "Driver ID:",
            driver._id.toString()
        );

        console.log(
            "Driver Name:",
            driver.Name
        );

        console.log(
            "Driver CountryCode:",
            driver.CountryCode
        );

        console.log(
            "Driver Phone:",
            driver.PhoneNumber
        );

        console.log(
            "Driver verificationStatus:",
            driver.verificationStatus
        );


        // ======================================================
        // 5. CHECK PASSWORD
        // ======================================================
        const isPasswordValid =
            await bcrypt.compare(
                Password,
                driver.Password
            );


        console.log(
            "Password valid:",
            isPasswordValid
        );


        if (!isPasswordValid) {

            console.log(
                " PASSWORD INVALID"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid phone number or password",
            });
        }


        console.log(
            "PASSWORD CORRECT"
        );

        // ======================================================
        // 6. DRIVER VERIFICATION
        // ======================================================

        console.log(
            "Database status:",
            driver.verificationStatus
        );

        console.log(
            "Expected status:",
            "Verified"
        );

        console.log(
            "Comparison result:",
            driver.verificationStatus !== "Verified"
        );


        if (
            driver.verificationStatus !==
            "Verified"
        ) {

            console.log(
                " DRIVER NOT VERIFIED"
            );

            return res.status(403).json({
                success: false,
                isApproved: false,

                verificationStatus:
                    driver.verificationStatus,

                message:
                    "Your account is pending admin verification. You cannot login until your account is approved.",
            });
        }


        console.log(
            " DRIVER VERIFIED"
        );


        // ======================================================
        // 7. FIND VEHICLE
        // ======================================================

        console.log(
            " SEARCHING VEHICLE..."
        );

        console.log(
            "Driver ID:",
            driver._id.toString()
        );


        const vehicle =
            await Vehicle.findOne({
                driver: driver._id,
            });


        if (!vehicle) {

            console.log(
                " VEHICLE NOT FOUND"
            );

            return res.status(403).json({
                success: false,
                isApproved: false,

                message:
                    "Vehicle information not found. You cannot login until your vehicle is approved.",
            });
        }


        console.log(
            "VEHICLE FOUND"
        );

        console.log(
            "Vehicle ID:",
            vehicle._id.toString()
        );

        console.log(
            "Vehicle verificationStatus:",
            vehicle.verificationStatus
        );
        // ======================================================
        // 8. VEHICLE VERIFICATION
        // ======================================================

        console.log(
            " VEHICLE VERIFICATION CHECK"
        );

        console.log(
            "Database status:",
            vehicle.verificationStatus
        );

        console.log(
            "Expected status:",
            "Verified"
        );

        console.log(
            "Comparison result:",
            vehicle.verificationStatus !== "Verified"
        );


        if (
            vehicle.verificationStatus !==
            "Verified"
        ) {

            console.log(
                " VEHICLE NOT VERIFIED"
            );

            return res.status(403).json({
                success: false,
                isApproved: false,

                verificationStatus:
                    vehicle.verificationStatus,

                message:
                    "Your vehicle is pending admin verification. You cannot login until your vehicle is approved.",
            });
        }


        console.log(
            "VEHICLE VERIFIED"
        );


        // ======================================================
        // 9. GENERATE JWT
        // ======================================================

        console.log(
            "GENERATING JWT..."
        );


        const token =
            jwt.sign(
                {
                    id:
                        driver._id.toString(),
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d",
                }
            );


        console.log(
            "JWT GENERATED"
        );


        // ======================================================
        // 10. REMOVE PASSWORD
        // ======================================================

        const driverResponse =
            driver.toObject();

        delete driverResponse.Password;


        // ======================================================
        // 11. SUCCESS
        // ======================================================


        console.log(
            " LOGIN SUCCESSFUL"
        );

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            isApproved: true,

            verificationStatus:
                driver.verificationStatus,

            vehicleVerificationStatus:
                vehicle.verificationStatus,

            token,

            driver:
                driverResponse,
        });


    } catch (error) {

        console.error(
            " LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    loginDriver,
};