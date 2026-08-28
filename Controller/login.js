const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../Schema/Driver");
const Vehicle = require("../Schema/Vehicle");

const loginDriver = async (req, res) => {
    try {
        const {
            CountryCode,
            PhoneNumber,
            Password,
            rememberMe
        } = req.body;

        if (!CountryCode || !PhoneNumber || !Password) {
            return res.status(400).json({
                success: false,
                message: "Country code, phone number and password are required"
            });
        }

        const cleanCountryCode = CountryCode
            .toString()
            .trim()
            .replace(/\s+/g, "");

        let cleanPhoneNumber = PhoneNumber
            .toString()
            .trim()
            .replace(/\s+/g, "");

        if (cleanPhoneNumber.startsWith(cleanCountryCode)) {
            cleanPhoneNumber = cleanPhoneNumber.slice(
                cleanCountryCode.length
            );
        }

        if (cleanPhoneNumber.startsWith("0")) {
            cleanPhoneNumber = cleanPhoneNumber.substring(1);
        }

        const driver = await Driver.findOne({
            CountryCode: cleanCountryCode,
            PhoneNumber: cleanPhoneNumber
        });

        if (!driver) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone number or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            Password,
            driver.Password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone number or password"
            });
        }

        if (driver.verificationStatus !== "Verified") {
            return res.status(403).json({
                success: false,
                isApproved: false,
                verificationStatus: driver.verificationStatus,
                message: "Your account is pending admin verification. You cannot login until your account is approved."
            });
        }

        const vehicle = await Vehicle.findOne({
            driver: driver._id
        });

        if (!vehicle) {
            return res.status(403).json({
                success: false,
                isApproved: false,
                message: "Vehicle information not found. You cannot login until your vehicle is approved."
            });
        }

        if (vehicle.verificationStatus !== "Verified") {
            return res.status(403).json({
                success: false,
                isApproved: false,
                verificationStatus: vehicle.verificationStatus,
                message: "Your vehicle is pending admin verification. You cannot login until your vehicle is approved."
            });
        }

        // REMEMBER ME → SAVE IN DATABASE
        driver.rememberMe = rememberMe === true || rememberMe === "true";
        await driver.save();

        let token;

        if (driver.rememberMe) {
            token = jwt.sign(
                {
                    id: driver._id.toString()
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "30d"
                }
            );
        } else {
            token = jwt.sign(
                {
                    id: driver._id.toString()
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );
        }

        const driverResponse = driver.toObject();

        delete driverResponse.Password;

        // RememberMe sirf login response mein rahega
        return res.status(200).json({
            success: true,
            message: "Login successful",
            isApproved: true,
            verificationStatus: driver.verificationStatus,
            vehicleVerificationStatus: vehicle.verificationStatus,
            rememberMe: driver.rememberMe,
            token,
            driver: driverResponse
        });

    } catch (error) {
        console.error("Driver Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    loginDriver
};