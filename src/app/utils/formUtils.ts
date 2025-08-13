// Shared form utilities leveraging CreateJobForm patterns
import { countries as countriesData } from "@/lib/countries";

// Country interface for UI components
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currencyCode?: string;
}

// Phone country codes with flags (comprehensive global coverage)
export const PHONE_COUNTRY_CODES = [
  // North America
  { code: "+1", name: "United States", flag: "🇺🇸", countryCode: "US" },
  { code: "+1", name: "Canada", flag: "🇨🇦", countryCode: "CA" },

  // Europe
  { code: "+44", name: "United Kingdom", flag: "🇬🇧", countryCode: "GB" },
  { code: "+33", name: "France", flag: "🇫🇷", countryCode: "FR" },
  { code: "+49", name: "Germany", flag: "🇩🇪", countryCode: "DE" },
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
  { code: "+351", name: "Portugal", flag: "🇵🇹", countryCode: "PT" },
  { code: "+30", name: "Greece", flag: "🇬🇷", countryCode: "GR" },
  { code: "+353", name: "Ireland", flag: "🇮🇪", countryCode: "IE" },
  { code: "+356", name: "Malta", flag: "🇲🇹", countryCode: "MT" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾", countryCode: "CY" },
  { code: "+7", name: "Russia", flag: "🇷🇺", countryCode: "RU" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦", countryCode: "UA" },
  { code: "+375", name: "Belarus", flag: "🇧🇾", countryCode: "BY" },
  { code: "+370", name: "Lithuania", flag: "🇱🇹", countryCode: "LT" },
  { code: "+371", name: "Latvia", flag: "🇱🇻", countryCode: "LV" },
  { code: "+372", name: "Estonia", flag: "🇪🇪", countryCode: "EE" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰", countryCode: "SK" },
  { code: "+386", name: "Slovenia", flag: "🇸🇮", countryCode: "SI" },
  { code: "+385", name: "Croatia", flag: "🇭🇷", countryCode: "HR" },
  {
    code: "+387",
    name: "Bosnia and Herzegovina",
    flag: "🇧🇦",
    countryCode: "BA",
  },
  { code: "+381", name: "Serbia", flag: "🇷🇸", countryCode: "RS" },
  { code: "+382", name: "Montenegro", flag: "🇲🇪", countryCode: "ME" },
  { code: "+389", name: "North Macedonia", flag: "🇲🇰", countryCode: "MK" },
  { code: "+355", name: "Albania", flag: "🇦🇱", countryCode: "AL" },
  { code: "+383", name: "Kosovo", flag: "🇽🇰", countryCode: "XK" },
  { code: "+40", name: "Romania", flag: "🇷🇴", countryCode: "RO" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬", countryCode: "BG" },
  { code: "+36", name: "Hungary", flag: "🇭🇺", countryCode: "HU" },
  { code: "+373", name: "Moldova", flag: "🇲🇩", countryCode: "MD" },
  { code: "+374", name: "Armenia", flag: "🇦🇲", countryCode: "AM" },
  { code: "+995", name: "Georgia", flag: "🇬🇪", countryCode: "GE" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿", countryCode: "AZ" },
  { code: "+90", name: "Turkey", flag: "🇹🇷", countryCode: "TR" },
  { code: "+354", name: "Iceland", flag: "🇮🇸", countryCode: "IS" },

  // Asia
  { code: "+91", name: "India", flag: "🇮🇳", countryCode: "IN" },
  { code: "+86", name: "China", flag: "🇨🇳", countryCode: "CN" },
  { code: "+81", name: "Japan", flag: "🇯🇵", countryCode: "JP" },
  { code: "+82", name: "South Korea", flag: "🇰🇷", countryCode: "KR" },
  { code: "+65", name: "Singapore", flag: "🇸🇬", countryCode: "SG" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾", countryCode: "MY" },
  { code: "+66", name: "Thailand", flag: "🇹🇭", countryCode: "TH" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩", countryCode: "ID" },
  { code: "+63", name: "Philippines", flag: "🇵🇭", countryCode: "PH" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳", countryCode: "VN" },
  { code: "+855", name: "Cambodia", flag: "🇰🇭", countryCode: "KH" },
  { code: "+856", name: "Laos", flag: "🇱🇦", countryCode: "LA" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲", countryCode: "MM" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩", countryCode: "BD" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰", countryCode: "LK" },
  { code: "+977", name: "Nepal", flag: "🇳🇵", countryCode: "NP" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹", countryCode: "BT" },
  { code: "+960", name: "Maldives", flag: "🇲🇻", countryCode: "MV" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰", countryCode: "PK" },
  { code: "+93", name: "Afghanistan", flag: "🇦🇫", countryCode: "AF" },
  { code: "+98", name: "Iran", flag: "🇮🇷", countryCode: "IR" },
  { code: "+964", name: "Iraq", flag: "🇮🇶", countryCode: "IQ" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼", countryCode: "KW" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭", countryCode: "BH" },
  { code: "+974", name: "Qatar", flag: "🇶🇦", countryCode: "QA" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪", countryCode: "AE" },
  { code: "+968", name: "Oman", flag: "🇴🇲", countryCode: "OM" },
  { code: "+967", name: "Yemen", flag: "🇾🇪", countryCode: "YE" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦", countryCode: "SA" },
  { code: "+962", name: "Jordan", flag: "🇯🇴", countryCode: "JO" },
  { code: "+961", name: "Lebanon", flag: "🇱🇧", countryCode: "LB" },
  { code: "+963", name: "Syria", flag: "🇸🇾", countryCode: "SY" },
  { code: "+972", name: "Israel", flag: "🇮🇱", countryCode: "IL" },
  { code: "+970", name: "Palestine", flag: "🇵🇸", countryCode: "PS" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰", countryCode: "HK" },
  { code: "+853", name: "Macau", flag: "🇲🇴", countryCode: "MO" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼", countryCode: "TW" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳", countryCode: "MN" },
  { code: "+850", name: "North Korea", flag: "🇰🇵", countryCode: "KP" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬", countryCode: "KG" },
  { code: "+998", name: "Uzbekistan", flag: "🇺🇿", countryCode: "UZ" },
  { code: "+992", name: "Tajikistan", flag: "🇹🇯", countryCode: "TJ" },
  { code: "+993", name: "Turkmenistan", flag: "🇹🇲", countryCode: "TM" },
  { code: "+7", name: "Kazakhstan", flag: "🇰🇿", countryCode: "KZ" },

  // Africa
  { code: "+27", name: "South Africa", flag: "🇿🇦", countryCode: "ZA" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬", countryCode: "NG" },
  { code: "+20", name: "Egypt", flag: "🇪🇬", countryCode: "EG" },
  { code: "+254", name: "Kenya", flag: "🇰🇪", countryCode: "KE" },
  { code: "+233", name: "Ghana", flag: "🇬🇭", countryCode: "GH" },
  { code: "+256", name: "Uganda", flag: "🇺🇬", countryCode: "UG" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿", countryCode: "TZ" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹", countryCode: "ET" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼", countryCode: "RW" },
  { code: "+212", name: "Morocco", flag: "🇲🇦", countryCode: "MA" },
  { code: "+216", name: "Tunisia", flag: "🇹🇳", countryCode: "TN" },
  { code: "+213", name: "Algeria", flag: "🇩🇿", countryCode: "DZ" },
  { code: "+218", name: "Libya", flag: "🇱🇾", countryCode: "LY" },
  { code: "+249", name: "Sudan", flag: "🇸🇩", countryCode: "SD" },
  { code: "+211", name: "South Sudan", flag: "🇸🇸", countryCode: "SS" },
  { code: "+267", name: "Botswana", flag: "🇧🇼", countryCode: "BW" },
  { code: "+264", name: "Namibia", flag: "🇳🇦", countryCode: "NA" },
  { code: "+260", name: "Zambia", flag: "🇿🇲", countryCode: "ZM" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼", countryCode: "ZW" },
  { code: "+258", name: "Mozambique", flag: "🇲🇿", countryCode: "MZ" },
  { code: "+265", name: "Malawi", flag: "🇲🇼", countryCode: "MW" },
  { code: "+268", name: "Eswatini", flag: "🇸🇿", countryCode: "SZ" },
  { code: "+266", name: "Lesotho", flag: "🇱🇸", countryCode: "LS" },
  { code: "+261", name: "Madagascar", flag: "🇲🇬", countryCode: "MG" },
  { code: "+230", name: "Mauritius", flag: "🇲🇺", countryCode: "MU" },
  { code: "+248", name: "Seychelles", flag: "🇸🇨", countryCode: "SC" },
  { code: "+221", name: "Senegal", flag: "🇸🇳", countryCode: "SN" },
  { code: "+223", name: "Mali", flag: "🇲🇱", countryCode: "ML" },
  { code: "+226", name: "Burkina Faso", flag: "🇧🇫", countryCode: "BF" },
  { code: "+227", name: "Niger", flag: "🇳🇪", countryCode: "NE" },
  { code: "+235", name: "Chad", flag: "🇹🇩", countryCode: "TD" },
  {
    code: "+236",
    name: "Central African Republic",
    flag: "🇨🇫",
    countryCode: "CF",
  },
  { code: "+237", name: "Cameroon", flag: "🇨🇲", countryCode: "CM" },
  { code: "+240", name: "Equatorial Guinea", flag: "🇬🇶", countryCode: "GQ" },
  { code: "+241", name: "Gabon", flag: "🇬🇦", countryCode: "GA" },
  {
    code: "+242",
    name: "Republic of the Congo",
    flag: "🇨🇬",
    countryCode: "CG",
  },
  {
    code: "+243",
    name: "Democratic Republic of the Congo",
    flag: "🇨🇩",
    countryCode: "CD",
  },
  { code: "+244", name: "Angola", flag: "🇦🇴", countryCode: "AO" },
  { code: "+229", name: "Benin", flag: "🇧🇯", countryCode: "BJ" },
  { code: "+228", name: "Togo", flag: "🇹🇬", countryCode: "TG" },
  { code: "+225", name: "Côte d'Ivoire", flag: "🇨🇮", countryCode: "CI" },
  { code: "+224", name: "Guinea", flag: "🇬🇳", countryCode: "GN" },
  { code: "+245", name: "Guinea-Bissau", flag: "🇬🇼", countryCode: "GW" },
  { code: "+220", name: "Gambia", flag: "🇬🇲", countryCode: "GM" },
  { code: "+231", name: "Liberia", flag: "🇱🇷", countryCode: "LR" },
  { code: "+232", name: "Sierra Leone", flag: "🇸🇱", countryCode: "SL" },
  { code: "+238", name: "Cape Verde", flag: "🇨🇻", countryCode: "CV" },
  { code: "+253", name: "Djibouti", flag: "🇩🇯", countryCode: "DJ" },
  { code: "+252", name: "Somalia", flag: "🇸🇴", countryCode: "SO" },
  { code: "+291", name: "Eritrea", flag: "🇪🇷", countryCode: "ER" },

  // Oceania
  { code: "+61", name: "Australia", flag: "🇦🇺", countryCode: "AU" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿", countryCode: "NZ" },
  { code: "+679", name: "Fiji", flag: "🇫🇯", countryCode: "FJ" },
  { code: "+685", name: "Samoa", flag: "🇼🇸", countryCode: "WS" },
  { code: "+676", name: "Tonga", flag: "🇹🇴", countryCode: "TO" },
  { code: "+678", name: "Vanuatu", flag: "🇻🇺", countryCode: "VU" },
  { code: "+687", name: "New Caledonia", flag: "🇳🇨", countryCode: "NC" },
  { code: "+689", name: "French Polynesia", flag: "🇵🇫", countryCode: "PF" },
  { code: "+684", name: "American Samoa", flag: "🇦🇸", countryCode: "AS" },
  { code: "+670", name: "East Timor", flag: "🇹🇱", countryCode: "TL" },
  { code: "+675", name: "Papua New Guinea", flag: "🇵🇬", countryCode: "PG" },
  { code: "+677", name: "Solomon Islands", flag: "🇸🇧", countryCode: "SB" },
  { code: "+686", name: "Kiribati", flag: "🇰🇮", countryCode: "KI" },
  { code: "+674", name: "Nauru", flag: "🇳🇷", countryCode: "NR" },
  { code: "+692", name: "Marshall Islands", flag: "🇲🇭", countryCode: "MH" },
  { code: "+691", name: "Micronesia", flag: "🇫🇲", countryCode: "FM" },
  { code: "+680", name: "Palau", flag: "🇵🇼", countryCode: "PW" },
  { code: "+688", name: "Tuvalu", flag: "🇹🇻", countryCode: "TV" },

  // South America
  { code: "+55", name: "Brazil", flag: "🇧🇷", countryCode: "BR" },
  { code: "+54", name: "Argentina", flag: "🇦🇷", countryCode: "AR" },
  { code: "+56", name: "Chile", flag: "🇨🇱", countryCode: "CL" },
  { code: "+57", name: "Colombia", flag: "🇨🇴", countryCode: "CO" },
  { code: "+51", name: "Peru", flag: "🇵🇪", countryCode: "PE" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪", countryCode: "VE" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨", countryCode: "EC" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴", countryCode: "BO" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾", countryCode: "PY" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾", countryCode: "UY" },
  { code: "+597", name: "Suriname", flag: "🇸🇷", countryCode: "SR" },
  { code: "+594", name: "French Guiana", flag: "🇬🇫", countryCode: "GF" },
  { code: "+592", name: "Guyana", flag: "🇬🇾", countryCode: "GY" },

  // Central America & Caribbean
  { code: "+52", name: "Mexico", flag: "🇲🇽", countryCode: "MX" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹", countryCode: "GT" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻", countryCode: "SV" },
  { code: "+504", name: "Honduras", flag: "🇭🇳", countryCode: "HN" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮", countryCode: "NI" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷", countryCode: "CR" },
  { code: "+507", name: "Panama", flag: "🇵🇦", countryCode: "PA" },
  { code: "+501", name: "Belize", flag: "🇧🇿", countryCode: "BZ" },
  { code: "+1", name: "Jamaica", flag: "🇯🇲", countryCode: "JM" },
  { code: "+1", name: "Bahamas", flag: "🇧🇸", countryCode: "BS" },
  { code: "+1", name: "Barbados", flag: "🇧🇧", countryCode: "BB" },
  { code: "+1", name: "Trinidad and Tobago", flag: "🇹🇹", countryCode: "TT" },
  { code: "+1", name: "Puerto Rico", flag: "🇵🇷", countryCode: "PR" },
  { code: "+1", name: "Dominican Republic", flag: "🇩🇴", countryCode: "DO" },
  { code: "+509", name: "Haiti", flag: "🇭🇹", countryCode: "HT" },
  { code: "+53", name: "Cuba", flag: "🇨🇺", countryCode: "CU" },
  { code: "+1", name: "Antigua and Barbuda", flag: "🇦🇬", countryCode: "AG" },
  { code: "+1", name: "Saint Kitts and Nevis", flag: "🇰🇳", countryCode: "KN" },
  { code: "+1", name: "Saint Lucia", flag: "🇱🇨", countryCode: "LC" },
  {
    code: "+1",
    name: "Saint Vincent and the Grenadines",
    flag: "🇻🇨",
    countryCode: "VC",
  },
  { code: "+1", name: "Grenada", flag: "🇬🇩", countryCode: "GD" },
  { code: "+1", name: "Dominica", flag: "🇩🇲", countryCode: "DM" },
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
