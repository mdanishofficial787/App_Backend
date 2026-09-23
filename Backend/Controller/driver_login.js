const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../schema/Driver");

const loginDriver = async (req, res) => {
    try {
        const {
            CountryCode,
            PhoneNumber,
            Password,
        } = req.body;

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

        const cleanCountryCode = CountryCode.trim();
        let cleanPhoneNumber = PhoneNumber.toString().trim();

        // Extract raw digits
        const rawDigits = cleanPhoneNumber.replace(/\D/g, '');
        // National digits (without 92 if included, and without leading 0)
        let nationalDigits = rawDigits;
        if (nationalDigits.startsWith('92')) {
            nationalDigits = nationalDigits.slice(2);
        }
        if (nationalDigits.startsWith('0')) {
            nationalDigits = nationalDigits.replace(/^0+/, '');
        }

        console.log(`[Driver Login Attempt] Raw: "${PhoneNumber}", National digits: "${nationalDigits}"`);

        // Find driver using multi-field flexible matching:
        // 1. Exact phone match
        // 2. Phone ending with national digits
        // 3. Regex matching digits anywhere
        // 4. Exact raw digits
        const possiblePhones = [
            cleanPhoneNumber,
            nationalDigits,
            `0${nationalDigits}`,
            `+92${nationalDigits}`,
            `+92 ${nationalDigits}`,
            `92${nationalDigits}`
        ];

        const driver = await Driver.findOne({
            $or: [
                { PhoneNumber: { $in: possiblePhones } },
                { PhoneNumber: new RegExp(nationalDigits + '$') },
                { PhoneNumber: new RegExp('^\\+?92\\s*' + nationalDigits + '$') }
            ]
        }).lean();

        if (!driver) {
            console.log(`[Driver Login FAIL] Driver NOT found for input: "${PhoneNumber}" (searched variants: ${possiblePhones.join(', ')})`);
            return res.status(401).json({
                success: false,
                message: "Invalid phone number or password",
            });
        }

        console.log(`[Driver Login FOUND] Driver: "${driver.Name}", Phone: "${driver.PhoneNumber}", Verification: "${driver.verificationStatus}"`);

        const isPasswordValid = await bcrypt.compare(
            Password,
            driver.Password
        );

        if (!isPasswordValid) {
            console.log(`[Driver Login FAIL] Password mismatch for driver "${driver.Name}"`);
            return res.status(401).json({
                success: false,
                message: "Invalid phone number or password",
            });
        }

        console.log(`[Driver Login SUCCESS] Driver "${driver.Name}" logged in successfully!`);

        if (
            driver.verificationStatus !== "Approved" &&
            driver.verificationStatus !== "Verified"
        ) {
            return res.status(403).json({
                success: false,
                isApproved: false,
                verificationStatus: driver.verificationStatus,
                message:
                    "Your account is pending admin verification. You cannot login until your account is approved.",
            });
        }

        const token = jwt.sign(
            {
                id: driver._id.toString(),
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        // Sanitize: if availability is not an object (corrupted data), reset it
        if (driver.availability && typeof driver.availability !== 'object') {
            driver.availability = null;
            // Also fix in the database so it doesn't crash again
            await Driver.updateOne(
                { _id: driver._id },
                { $unset: { availability: "" } }
            );
        }

        const driverResponse = { ...driver };
        delete driverResponse.Password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            isApproved: true,
            verificationStatus: driver.verificationStatus,
            token,
            driver: driverResponse,
        });
    } catch (error) {
        console.error("Login Driver Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports = {
    loginDriver,
};
