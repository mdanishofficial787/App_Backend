const { parsePhoneNumberFromString, getCountryCallingCode } = require("libphonenumber-js");

/**
 * Global Phone Number & Country Code Auto-Detector
 * @param {string} inputPhone - e.g., "+447911123456", "447911123456", "03001234567"
 * @param {string|null} defaultCountryIso - Pass null if you want pure auto-detection
 */
const parseGlobalPhoneNumber = (inputPhone, defaultCountryIso = null) => {
    let raw = String(inputPhone || "").trim();
    if (!raw) return null;

    let parsed = null;

    // 1. First Priority: If number already starts with '+', parse directly
    if (raw.startsWith("+")) {
        parsed = parsePhoneNumberFromString(raw);
    }
    // 2. Second Priority: If user typed international format without '+' (e.g. "447911123456")
    else {
        parsed = parsePhoneNumberFromString(`+${raw}`);

        // 3. Third Priority: If "+raw" failed and default country ISO exists, parse as local number
        if ((!parsed || !parsed.isValid()) && defaultCountryIso) {
            parsed = parsePhoneNumberFromString(raw, defaultCountryIso.toUpperCase());
        }
    }

    // Valid Number Found Across Any Country
    if (parsed && parsed.isValid()) {
        return {
            isValid: true,
            countryCode: `+${parsed.countryCallingCode}`,
            countryIso: parsed.country, // 'GB', 'PK', 'US', etc.
            formattedLocal: parsed.formatNational().replace(/\s+/g, ""),
            fullInternational: parsed.format("E.164") // e.g. "+447911123456"
        };
    }

    // Dynamic Fallback for Invalid/Partial Inputs
    const cleanDigits = raw.replace(/[^\d+]/g, "");
    let fallbackCode = "+92";

    try {
        if (defaultCountryIso) {
            fallbackCode = `+${getCountryCallingCode(defaultCountryIso.toUpperCase())}`;
        }
    } catch (e) {
        fallbackCode = "+92";
    }

    if (cleanDigits.startsWith("+")) {
        const match = cleanDigits.match(/^\+(\d{1,3})/);
        if (match) fallbackCode = `+${match[1]}`;
    }

    return {
        isValid: false,
        countryCode: fallbackCode,
        countryIso: defaultCountryIso ? defaultCountryIso.toUpperCase() : null,
        formattedLocal: cleanDigits.replace(/^\+/, ""),
        fullInternational: cleanDigits.startsWith("+") ? cleanDigits : `${fallbackCode}${cleanDigits.replace(/^0/, "")}`
    };
};

module.exports = {
    parseGlobalPhoneNumber
};