import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
}

const regionNames =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Priority countries shown at the top of the selector
const POPULAR_COUNTRIES: CountryCode[] = [
  "IN", // India (default)
  "US", // United States
  "GB", // United Kingdom
  "AE", // UAE
  "SA", // Saudi Arabia
  "SG", // Singapore
  "MY", // Malaysia
  "NP", // Nepal
  "BD", // Bangladesh
  "CA", // Canada
  "AU", // Australia
  "QA", // Qatar
  "OM", // Oman
  "KW", // Kuwait
];

export function getCountryOptions(): CountryOption[] {
  const allCodes = getCountries();
  const popularSet = new Set(POPULAR_COUNTRIES);

  const formatOption = (code: CountryCode): CountryOption => {
    let callingCode = "";
    try {
      callingCode = `+${getCountryCallingCode(code)}`;
    } catch {
      callingCode = "";
    }
    const name = regionNames?.of(code) || code;
    return {
      code,
      name,
      callingCode,
      flag: getCountryFlag(code),
    };
  };

  const popularList = POPULAR_COUNTRIES.filter((code) => allCodes.includes(code)).map(formatOption);
  const remainingList = allCodes
    .filter((code) => !popularSet.has(code))
    .map(formatOption)
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...popularList, ...remainingList];
}

/**
 * Strip spaces, dashes, parentheses, dots and leading/trailing whitespace before validating
 */
export function cleanPhoneNumber(input: string): string {
  if (!input) return "";
  return input.trim().replace(/[\s\-().]/g, "");
}

/**
 * Validate phone number using libphonenumber-js with the selected country code
 */
export function validatePhoneNumber(
  input: string,
  countryCode: CountryCode = "IN",
): {
  isValid: boolean;
  e164?: string;
  error?: string;
} {
  const cleaned = cleanPhoneNumber(input);
  if (!cleaned) {
    return { isValid: false, error: "Invalid number" };
  }

  try {
    const valid = isValidPhoneNumber(cleaned, countryCode);
    if (!valid) {
      return { isValid: false, error: "Invalid number" };
    }

    const parsed = parsePhoneNumberFromString(cleaned, countryCode);
    if (!parsed || !parsed.isValid()) {
      return { isValid: false, error: "Invalid number" };
    }

    return {
      isValid: true,
      e164: parsed.format("E.164"),
    };
  } catch {
    return { isValid: false, error: "Invalid number" };
  }
}

/**
 * Converts valid phone string to E.164 format (+[countryCode][number])
 */
export function formatToE164(input: string, countryCode: CountryCode = "IN"): string | null {
  const result = validatePhoneNumber(input, countryCode);
  return result.isValid && result.e164 ? result.e164 : null;
}
