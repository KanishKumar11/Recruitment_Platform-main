// Shared form utilities leveraging CreateJobForm patterns
import { countries as countriesData } from "@/lib/countries";

// Country interface for UI components
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currencyCode?: string;
}

// Phone country codes with flags (extracted from CreateJobForm pattern)
export const PHONE_COUNTRY_CODES = [
  { code: "+1", name: "United States", flag: "🇺🇸", countryCode: "US" },
  { code: "+91", name: "India", flag: "🇮🇳", countryCode: "IN" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧", countryCode: "GB" },
  { code: "+33", name: "France", flag: "🇫🇷", countryCode: "FR" },
  { code: "+49", name: "Germany", flag: "🇩🇪", countryCode: "DE" },
  { code: "+86", name: "China", flag: "🇨🇳", countryCode: "CN" },
  { code: "+81", name: "Japan", flag: "🇯🇵", countryCode: "JP" },
  { code: "+82", name: "South Korea", flag: "🇰🇷", countryCode: "KR" },
  { code: "+61", name: "Australia", flag: "🇦🇺", countryCode: "AU" },
  { code: "+1", name: "Canada", flag: "🇨🇦", countryCode: "CA" },
  { code: "+55", name: "Brazil", flag: "🇧🇷", countryCode: "BR" },
  { code: "+52", name: "Mexico", flag: "🇲🇽", countryCode: "MX" },
  { code: "+7", name: "Russia", flag: "🇷🇺", countryCode: "RU" },
  { code: "+39", name: "Italy", flag: "🇮🇹", countryCode: "IT" },
  { code: "+34", name: "Spain", flag: "🇪🇸", countryCode: "ES" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱", countryCode: "NL" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭", countryCode: "CH" },
  { code: "+46", name: "Sweden", flag: "🇸🇪", countryCode: "SE" },
  { code: "+47", name: "Norway", flag: "🇳🇴", countryCode: "NO" },
  { code: "+45", name: "Denmark", flag: "🇩🇰", countryCode: "DK" },
  { code: "+358", name: "Finland", flag: "🇫🇮", countryCode: "FI" },
  { code: "+48", name: "Poland", flag: "🇵🇱", countryCode: "PL" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿", countryCode: "CZ" },
  { code: "+43", name: "Austria", flag: "🇦🇹", countryCode: "AT" },
  { code: "+32", name: "Belgium", flag: "🇧🇪", countryCode: "BE" },
  { code: "+65", name: "Singapore", flag: "🇸🇬", countryCode: "SG" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾", countryCode: "MY" },
  { code: "+66", name: "Thailand", flag: "🇹🇭", countryCode: "TH" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩", countryCode: "ID" },
  { code: "+63", name: "Philippines", flag: "🇵🇭", countryCode: "PH" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳", countryCode: "VN" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪", countryCode: "AE" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦", countryCode: "SA" },
  { code: "+972", name: "Israel", flag: "🇮🇱", countryCode: "IL" },
  { code: "+90", name: "Turkey", flag: "🇹🇷", countryCode: "TR" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦", countryCode: "UA" },
  { code: "+20", name: "Egypt", flag: "🇪🇬", countryCode: "EG" },
  { code: "+27", name: "South Africa", flag: "🇿🇦", countryCode: "ZA" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿", countryCode: "NZ" },
  { code: "+351", name: "Portugal", flag: "🇵🇹", countryCode: "PT" },
  { code: "+30", name: "Greece", flag: "🇬🇷", countryCode: "GR" },
  { code: "+353", name: "Ireland", flag: "🇮🇪", countryCode: "IE" },
  { code: "+356", name: "Malta", flag: "🇲🇹", countryCode: "MT" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾", countryCode: "CY" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰", countryCode: "HK" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼", countryCode: "TW" },
].sort((a, b) => a.name.localeCompare(b.name));

// Create unique countries list from CreateJobForm data (same as CreateJobForm implementation)
export const UNIQUE_COUNTRIES: CountryOption[] = Array.from(
  new Map(
    countriesData.map((item) => [
      item.countryCode,
      {
        code: item.countryCode,
        name: item.country,
        flag: item.flag || "",
        currencyCode: item.code,
      },
    ])
  ).values()
).sort((a, b) => a.name.localeCompare(b.name));

// Compensation types (from CreateJobForm)
export const COMPENSATION_TYPES = [
  { value: "HOURLY", label: "Hourly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUALLY", label: "Annual" },
] as const;

export type CompensationType = (typeof COMPENSATION_TYPES)[number]["value"];

// Validation utilities
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 7;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
