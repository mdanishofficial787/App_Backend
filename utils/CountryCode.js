const {
    parsePhoneNumberFromString,
    getCountryCallingCode,
} = require("libphonenumber-js");

/**
 * Global Phone Number Parser Utility
 * Extracts exact Country Code (+92, +1, etc.), ISO, and Local National Number
 */
const parseGlobalPhoneNumber = (inputPhone, defaultCountryIso = null) => {
    const raw = String(inputPhone || "").trim();

    // Return early if no phone number provided
    if (!raw) {
        return {
            isValid: false,
            countryCode: null,
            countryIso: null,
            formattedLocal: "",
            fullInternational: "",
        };
    }

    let parsed = null;

    // 1. Parse standard E.164 number with leading "+"
    if (raw.startsWith("+")) {
        parsed = parsePhoneNumberFromString(raw);
    } else {
        // 2. Try parsing with added "+" prefix first
        parsed = parsePhoneNumberFromString(`+${raw}`);

        // 3. Fallback to local number parsing using provided country ISO (e.g. "03001234567" + "PK")
        if ((!parsed || !parsed.isValid()) && defaultCountryIso) {
            parsed = parsePhoneNumberFromString(
                raw,
                defaultCountryIso.toUpperCase()
            );
        }
    }

    // SUCCESS CASE: Valid parsed phone number
    if (parsed && parsed.isValid()) {
        return {
            isValid: true,
            countryCode: `+${parsed.countryCallingCode}`,
            countryIso: parsed.country,
            formattedLocal: parsed.nationalNumber.toString(),
            fullInternational: parsed.format("E.164"),
        };
    }

    // FALLBACK CASE: Invalid or incomplete phone number handling
    const cleanDigits = raw.replace(/[^\d+]/g, "");
    let fallbackCode = null;
    let fallbackIso = null;

    if (defaultCountryIso && !cleanDigits.startsWith("+")) {
        try {
            const iso = defaultCountryIso.toUpperCase();
            fallbackCode = `+${getCountryCallingCode(iso)}`;
            fallbackIso = iso;
        } catch (error) {
            fallbackCode = null;
            fallbackIso = null;
        }
    }

    return {
        isValid: false,
        countryCode: fallbackCode,
        countryIso: fallbackIso,
        formattedLocal: cleanDigits.replace(/^\+/, ""),
        fullInternational: cleanDigits.startsWith("+")
            ? cleanDigits
            : fallbackCode
                ? `${fallbackCode}${cleanDigits.replace(/^0/, "")}`
                : cleanDigits,
    };
};

module.exports = {
    parseGlobalPhoneNumber,
};