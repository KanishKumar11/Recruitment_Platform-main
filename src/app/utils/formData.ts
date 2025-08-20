// Shared form data utilities
// Updated to use comprehensive country data from countryData.ts
import { COMPLETE_COUNTRY_DATA } from './countryData';

// Country codes with phone country codes - now comprehensive with all 195 countries
export const COUNTRIES_WITH_CODES = COMPLETE_COUNTRY_DATA.map(country => ({
  name: country.name,
  code: country.code,
  phoneCode: country.phoneCode
})).sort((a, b) => a.name.localeCompare(b.name));

// Legacy countries with codes (keeping for reference)
const LEGACY_COUNTRIES_WITH_CODES = [
  { name: "United States", code: "US", phoneCode: "+1" },
  { name: "United Kingdom", code: "GB", phoneCode: "+44" },
  { name: "Canada", code: "CA", phoneCode: "+1" },
  { name: "Australia", code: "AU", phoneCode: "+61" },
  { name: "Germany", code: "DE", phoneCode: "+49" },
  { name: "France", code: "FR", phoneCode: "+33" },
  { name: "Italy", code: "IT", phoneCode: "+39" },
  { name: "Spain", code: "ES", phoneCode: "+34" },
  { name: "Netherlands", code: "NL", phoneCode: "+31" },
  { name: "Belgium", code: "BE", phoneCode: "+32" },
  { name: "Switzerland", code: "CH", phoneCode: "+41" },
  { name: "Austria", code: "AT", phoneCode: "+43" },
  { name: "Sweden", code: "SE", phoneCode: "+46" },
  { name: "Norway", code: "NO", phoneCode: "+47" },
  { name: "Denmark", code: "DK", phoneCode: "+45" },
  { name: "Finland", code: "FI", phoneCode: "+358" },
  { name: "Ireland", code: "IE", phoneCode: "+353" },
  { name: "Portugal", code: "PT", phoneCode: "+351" },
  { name: "Greece", code: "GR", phoneCode: "+30" },
  { name: "Poland", code: "PL", phoneCode: "+48" },
  { name: "Czech Republic", code: "CZ", phoneCode: "+420" },
  { name: "Hungary", code: "HU", phoneCode: "+36" },
  { name: "Slovakia", code: "SK", phoneCode: "+421" },
  { name: "Slovenia", code: "SI", phoneCode: "+386" },
  { name: "Croatia", code: "HR", phoneCode: "+385" },
  { name: "Romania", code: "RO", phoneCode: "+40" },
  { name: "Bulgaria", code: "BG", phoneCode: "+359" },
  { name: "Lithuania", code: "LT", phoneCode: "+370" },
  { name: "Latvia", code: "LV", phoneCode: "+371" },
  { name: "Estonia", code: "EE", phoneCode: "+372" },
  { name: "Luxembourg", code: "LU", phoneCode: "+352" },
  { name: "Malta", code: "MT", phoneCode: "+356" },
  { name: "Cyprus", code: "CY", phoneCode: "+357" },
  { name: "Japan", code: "JP", phoneCode: "+81" },
  { name: "South Korea", code: "KR", phoneCode: "+82" },
  { name: "China", code: "CN", phoneCode: "+86" },
  { name: "India", code: "IN", phoneCode: "+91" },
  { name: "Singapore", code: "SG", phoneCode: "+65" },
  { name: "Hong Kong", code: "HK", phoneCode: "+852" },
  { name: "Taiwan", code: "TW", phoneCode: "+886" },
  { name: "Thailand", code: "TH", phoneCode: "+66" },
  { name: "Malaysia", code: "MY", phoneCode: "+60" },
  { name: "Indonesia", code: "ID", phoneCode: "+62" },
  { name: "Philippines", code: "PH", phoneCode: "+63" },
  { name: "Vietnam", code: "VN", phoneCode: "+84" },
  { name: "Brazil", code: "BR", phoneCode: "+55" },
  { name: "Mexico", code: "MX", phoneCode: "+52" },
  { name: "Argentina", code: "AR", phoneCode: "+54" },
  { name: "Chile", code: "CL", phoneCode: "+56" },
  { name: "Colombia", code: "CO", phoneCode: "+57" },
  { name: "Peru", code: "PE", phoneCode: "+51" },
  { name: "South Africa", code: "ZA", phoneCode: "+27" },
  { name: "Egypt", code: "EG", phoneCode: "+20" },
  { name: "Israel", code: "IL", phoneCode: "+972" },
  { name: "Turkey", code: "TR", phoneCode: "+90" },
  { name: "Russia", code: "RU", phoneCode: "+7" },
  { name: "Ukraine", code: "UA", phoneCode: "+380" },
  { name: "United Arab Emirates", code: "AE", phoneCode: "+971" },
  { name: "Saudi Arabia", code: "SA", phoneCode: "+966" },
  { name: "New Zealand", code: "NZ", phoneCode: "+64" },
].sort((a, b) => a.name.localeCompare(b.name));

// Compensation types
export const COMPENSATION_TYPES = [
  { value: "HOURLY", label: "Hourly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUALLY", label: "Annual" },
] as const;

// Simple country list for dropdowns - now comprehensive with all 195 countries
export const COUNTRIES_LIST = COMPLETE_COUNTRY_DATA.map(country => country.name).sort();

// Legacy countries list (keeping for reference)
const LEGACY_COUNTRIES_LIST = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, North",
  "Korea, South",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Remote",
].sort();

// Validation utilities
export const validatePhone = (phone: string): boolean => {
  if (!phone || phone.trim() === "") return false;
  
  // E.164 format validation: +[country code][number] (7-15 digits total)
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  
  // If it's in E.164 format, validate it
  if (e164Regex.test(phone)) {
    return true;
  }
  
  // Fallback: Basic phone validation for other formats
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digitsOnly = phone.replace(/\D/g, "");
  return phoneRegex.test(phone) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Type definitions
export type CompensationType = (typeof COMPENSATION_TYPES)[number]["value"];

export interface CountryWithCode {
  name: string;
  code: string;
  phoneCode: string;
}

export interface ApplicantFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  country: string;

  // Professional Info
  currentTitle: string;
  experienceYears: number;
  expectedCompensationType: CompensationType;
  expectedSalary: number;
  noticePeriod: string;

  // Application Info
  resumeFile?: File;
  coverLetter: string;

  // Consent
  candidateConsent: boolean;
}
