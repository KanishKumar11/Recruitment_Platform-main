// Utility functions for country code to name conversion
import { countries } from "@/lib/countries";

// Create a map of country codes to country names for quick lookup
const countryCodeToNameMap = countries.reduce<Record<string, string>>((acc, country) => {
  acc[country.code] = country.name;
  return acc;
}, {});

// Additional common country codes that might not be in the main list
const additionalCountryCodes: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom", 
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  PT: "Portugal",
  GR: "Greece",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  SK: "Slovakia",
  SI: "Slovenia",
  HR: "Croatia",
  BG: "Bulgaria",
  RO: "Romania",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  MT: "Malta",
  CY: "Cyprus",
  LU: "Luxembourg",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  TH: "Thailand",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  BD: "Bangladesh",
  PK: "Pakistan",
  LK: "Sri Lanka",
  NP: "Nepal",
  MM: "Myanmar",
  KH: "Cambodia",
  LA: "Laos",
  MN: "Mongolia",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  EC: "Ecuador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  GY: "Guyana",
  SR: "Suriname",
  MX: "Mexico",
  GT: "Guatemala",
  BZ: "Belize",
  SV: "El Salvador",
  HN: "Honduras",
  NI: "Nicaragua",
  CR: "Costa Rica",
  PA: "Panama",
  CU: "Cuba",
  JM: "Jamaica",
  HT: "Haiti",
  DO: "Dominican Republic",
  TT: "Trinidad and Tobago",
  BB: "Barbados",
  GD: "Grenada",
  LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines",
  AG: "Antigua and Barbuda",
  DM: "Dominica",
  KN: "Saint Kitts and Nevis",
  BS: "Bahamas",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  UG: "Uganda",
  TZ: "Tanzania",
  ZW: "Zimbabwe",
  ZM: "Zambia",
  MW: "Malawi",
  MZ: "Mozambique",
  BW: "Botswana",
  NA: "Namibia",
  SZ: "Eswatini",
  LS: "Lesotho",
  MG: "Madagascar",
  MU: "Mauritius",
  SC: "Seychelles",
  CV: "Cape Verde",
  ST: "São Tomé and Príncipe",
  GQ: "Equatorial Guinea",
  GA: "Gabon",
  CG: "Republic of the Congo",
  CD: "Democratic Republic of the Congo",
  CF: "Central African Republic",
  TD: "Chad",
  CM: "Cameroon",
  BJ: "Benin",
  TG: "Togo",
  BF: "Burkina Faso",
  NE: "Niger",
  ML: "Mali",
  SN: "Senegal",
  GM: "Gambia",
  GW: "Guinea-Bissau",
  GN: "Guinea",
  SL: "Sierra Leone",
  LR: "Liberia",
  CI: "Côte d'Ivoire",
  EG: "Egypt",
  LY: "Libya",
  TN: "Tunisia",
  DZ: "Algeria",
  MA: "Morocco",
  SD: "Sudan",
  SS: "South Sudan",
  ET: "Ethiopia",
  ER: "Eritrea",
  DJ: "Djibouti",
  SO: "Somalia",
  RU: "Russia",
  UA: "Ukraine",
  BY: "Belarus",
  MD: "Moldova",
  GE: "Georgia",
  AM: "Armenia",
  AZ: "Azerbaijan",
  KZ: "Kazakhstan",
  KG: "Kyrgyzstan",
  TJ: "Tajikistan",
  TM: "Turkmenistan",
  UZ: "Uzbekistan",
  AF: "Afghanistan",
  IR: "Iran",
  IQ: "Iraq",
  SY: "Syria",
  LB: "Lebanon",
  JO: "Jordan",
  IL: "Israel",
  PS: "Palestine",
  SA: "Saudi Arabia",
  YE: "Yemen",
  OM: "Oman",
  AE: "United Arab Emirates",
  QA: "Qatar",
  BH: "Bahrain",
  KW: "Kuwait",
  TR: "Turkey",
  IS: "Iceland",
  FO: "Faroe Islands",
  GL: "Greenland",
  NZ: "New Zealand",
  FJ: "Fiji",
  PG: "Papua New Guinea",
  SB: "Solomon Islands",
  VU: "Vanuatu",
  NC: "New Caledonia",
  PF: "French Polynesia",
  WS: "Samoa",
  TO: "Tonga",
  TV: "Tuvalu",
  KI: "Kiribati",
  NR: "Nauru",
  PW: "Palau",
  FM: "Micronesia",
  MH: "Marshall Islands",
  CK: "Cook Islands",
  NU: "Niue",
  TK: "Tokelau",
  WF: "Wallis and Futuna",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
  VI: "U.S. Virgin Islands",
  PR: "Puerto Rico",
  AD: "Andorra",
  MC: "Monaco",
  SM: "San Marino",
  VA: "Vatican City",
  LI: "Liechtenstein",
  MK: "North Macedonia",
  AL: "Albania",
  ME: "Montenegro",
  RS: "Serbia",
  BA: "Bosnia and Herzegovina",
  XK: "Kosovo",
};

/**
 * Convert a country code to its full country name
 * @param countryCode - The 2-letter country code (e.g., "US", "GB", "CA")
 * @returns The full country name or the original code if not found
 */
export function getCountryNameFromCode(countryCode: string): string {
  if (!countryCode) return "";
  
  const upperCode = countryCode.toUpperCase();
  
  // First check the main countries data
  const countryName = countryCodeToNameMap[upperCode];
  if (countryName) {
    return countryName;
  }
  
  // Then check additional country codes
  const additionalName = additionalCountryCodes[upperCode];
  if (additionalName) {
    return additionalName;
  }
  
  // If not found, return the original code
  return countryCode;
}

/**
 * Check if a string is likely a country code (2-3 letters, all uppercase)
 * @param value - The value to check
 * @returns True if it looks like a country code
 */
export function isCountryCode(value: string): boolean {
  if (!value) return false;
  return /^[A-Z]{2,3}$/.test(value.toUpperCase());
}

/**
 * Format location display with full country name
 * @param location - The city/location
 * @param country - The country (could be code or name)
 * @returns Formatted location string
 */
export function formatLocationDisplay(location: string, country: string): string {
  if (!location && !country) return "";
  if (!country) return location;
  if (!location) return getCountryNameFromCode(country);
  
  const countryName = isCountryCode(country) ? getCountryNameFromCode(country) : country;
  return `${location}, ${countryName}`;
}
