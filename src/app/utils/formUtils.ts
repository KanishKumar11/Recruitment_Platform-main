// Shared form utilities leveraging CreateJobForm patterns
import { countries as countriesData } from "@/lib/countries";
import { PHONE_COUNTRY_CODES as COMPLETE_PHONE_COUNTRY_CODES } from './countryData';

// Country interface for UI components
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currencyCode?: string;
}

// Use comprehensive phone country codes from countryData.ts
export const PHONE_COUNTRY_CODES = COMPLETE_PHONE_COUNTRY_CODES;

// Note: Legacy phone country codes have been replaced with comprehensive data from countryData.ts

// Create unique countries list from CreateJobForm data (same as CreateJobForm implementation)
export const UNIQUE_COUNTRIES: CountryOption[] = Array.from(
  new Map(
    countriesData.map((item) => [
      item.code,
      {
        code: item.code,
        name: item.name,
        flag: item.image || "",
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
