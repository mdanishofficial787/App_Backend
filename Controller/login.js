const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../Schema/Driver");

const loginDriver = async (req, res) => {
    try {
        const {
            CountryCode,
            PhoneNumber,
            Password,
        } = req.body;

        // ==========================================
        // 1. VALIDATION
        // ==========================================
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

        // ==========================================
        // 2. CLEAN DATA
        // ==========================================
        const cleanCountryCode =
            CountryCode.trim();

        let cleanPhoneNumber =
            PhoneNumber.toString().trim();

        // Agar frontend +92 ke sath number bheje
        // +923001234567
        if (
            cleanPhoneNumber.startsWith(
                cleanCountryCode
            )
        ) {
            cleanPhoneNumber =
                cleanPhoneNumber
                    .slice(cleanCountryCode.length)
                    .trim();
        }

        // ==========================================
        // 3. FIND DRIVER
        // ==========================================
        const driver = await Driver.findOne({
            CountryCode: cleanCountryCode,
            PhoneNumber: cleanPhoneNumber,
        });

        if (!driver) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid phone number or password",
            });
        }

        // ==========================================
        // 4. CHECK PASSWORD
        // ==========================================
        const isPasswordValid =
            await bcrypt.compare(
                Password,
                driver.Password
            );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid phone number or password",
            });
        }

        // ==========================================
        // 5. GENERATE JWT
        // ==========================================
        const token = jwt.sign(
            {
                id: driver._id.toString(),
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        // ==========================================
        // 6. DRIVER RESPONSE
        // ==========================================
        const driverResponse =
            driver.toObject();

        // Never send password
        delete driverResponse.Password;

        // ==========================================
        // 7. SUCCESS
        // ==========================================
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            driver: driverResponse,
        });

    } catch (error) {
        console.error(
            "Login Driver Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    loginDriver,
};