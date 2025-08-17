"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Clock, DollarSign, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import { countries } from "@/lib/countries";
import { CountrySelector } from "@/components/ui/country-selector";
import { useCreateJobMutation } from "@/app/store/services/jobsApi";
import { JobStatus } from "../constants/jobStatus";
import { JobType } from "../constants/jobType";
import RichTextEditor from "./RichTextEditor";

// Import the Country type from lib/countries
import { Country } from "@/lib/countries";

// Use the countries data which contains both country and currency information
const countriesData: Country[] = countries;

// Helper function to get currency code from country code
function getCurrencyFromCountryCode(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
    JP: "JPY", CN: "CNY", IN: "INR", BR: "BRL", MX: "MXN", KR: "KRW", SG: "SGD",
    CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", NZ: "NZD", ZA: "ZAR", RU: "RUB",
    AE: "AED", SA: "SAR", TR: "TRY", TH: "THB", ID: "IDR", PH: "PHP", MY: "MYR",
    VN: "VND", EG: "EGP", PK: "PKR", BD: "BDT"
  };
  return currencyMap[countryCode] || "USD";
}

// Create a map of currency code to countries that use it
const currencyToCountriesMap = countriesData.reduce<
  Record<string, Country[]>
>((acc, item) => {
  const currencyCode = getCurrencyFromCountryCode(item.code);
  if (currencyCode) {
    if (!acc[currencyCode]) {
      acc[currencyCode] = [];
    }
    acc[currencyCode].push(item);
  }
  return acc;
}, {});

// Create a map of country code to country data for easy lookup
const countryCodeToDataMap = countriesData.reduce<Record<string, Country>>(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {}
);

// Create a unique list of countries for the country selector
const uniqueCountries = Array.from(
  new Map(
    countriesData.map((item) => [
      item.code,
      {
        code: item.code,
        name: item.name,
        flag: item.image || "",
        currencyCode: getCurrencyFromCountryCode(item.code),
      },
    ])
  ).values()
);

// Create a unique list of currencies for the currency selector
const uniqueCurrencies = Array.from(
  new Map(
    countriesData.map((item) => {
      const currencyCode = getCurrencyFromCountryCode(item.code);
      return [
        currencyCode,
        {
          code: currencyCode,
          name: `${currencyCode} - ${item.name}`,
          symbol: getCurrencySymbol(currencyCode),
        },
      ];
    })
  ).values()
);

// Helper function to get currency symbol from currency code
function getCurrencySymbol(currencyCode: string): string {
  // For common currencies, return their symbols
  const symbolMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    BRL: "R$",
    MXN: "$",
    SGD: "S$",
    NZD: "NZ$",
    HKD: "HK$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    HUF: "Ft",
    ILS: "₪",
    KRW: "₩",
    MYR: "RM",
    PHP: "₱",
    THB: "฿",
    TRY: "₺",
    ZAR: "R",
    RUB: "₽",
    AED: "د.إ",
    SAR: "﷼",
    EGP: "E£",
    PKR: "₨",
    BDT: "৳",
    IDR: "Rp",
    VND: "₫",
    UAH: "₴",
    ARS: "$",
    CLP: "$",
    PEN: "S/",
    COP: "$",
    BOB: "Bs.",
    CRC: "₡",
    DOP: "RD$",
    GTQ: "Q",
    HNL: "L",
    NIO: "C$",
    PAB: "B/.",
    PYG: "₲",
    UYU: "$U",
    VEF: "Bs",
    IRR: "﷼",
    IQD: "ع.د",
    KWD: "د.ك",
    OMR: "ر.ع.",
    QAR: "ر.ق",
    YER: "﷼",
    LBP: "ل.ل",
    JOD: "د.ا",
    BHD: ".د.ب",
    LYD: "ل.د",
    TND: "د.ت",
    MAD: "د.م.",
    DZD: "د.ج",
    AZN: "₼",
    AMD: "դր.",
    BYN: "Br",
    BGN: "лв",
    HRK: "kn",
    GEL: "₾",
    ISK: "kr",
    KZT: "₸",
    KGS: "с",
    MKD: "ден",
    MDL: "L",
    RSD: "дин",
    TJS: "SM",
    TMT: "m",
    UZS: "сўм",
    AFN: "؋",
    ETB: "Br",
    GHS: "₵",
    KES: "KSh",
    MWK: "MK",
    MUR: "₨",
    NGN: "₦",
    RWF: "FRw",
    TZS: "TSh",
    UGX: "USh",
    ZMW: "ZK",
    BWP: "P",
    MZN: "MT",
    AOA: "Kz",
    CDF: "FC",
    XOF: "CFA",
    XAF: "FCFA",
    XPF: "₣",
  };

  return symbolMap[currencyCode] || currencyCode;
}

// Commission configuration
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 50,
  MIN_REDUCTION_PERCENTAGE: 0,
  MAX_REDUCTION_PERCENTAGE: 80,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
};

// Define types for form data
interface JobFormData {
  title: string;
  jobCode: string;
  companyName: string;
  country: string;
  compensationType: "HOURLY" | "MONTHLY" | "ANNUALLY";
  location: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  paymentTerms: string;
  positions: number;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP";
  experienceLevel: {
    min: number;
    max: number;
  };
  compensationDetails: string;
  replacementTerms: string;
  commission: {
    type: "percentage" | "fixed" | "hourly";
    originalPercentage: number;
    fixedAmount: number;
    hourlyRate: number;
    recruiterPercentage: number;
    platformFeePercentage: number;
    reductionPercentage: number;
    originalAmount: number;
    recruiterAmount: number;
  };
  // Legacy fields for backward compatibility
  commissionPercentage: number;
  commissionAmount: number;
  description: string;
  companyDescription: string;
  sourcingGuidelines: string;
}

// Props interface for the component
interface CreateJobFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  cancelPath?: string;
}

// Helper function to get redirect path based on user role
const getRedirectPath = (userRole: string | undefined): string => {
  switch (userRole?.toLowerCase()) {
    case "internal":
      return "/dashboard/internal/jobs";
    case "admin":
      return "/dashboard/admin/jobs";
    case "company":
      return "/dashboard/company/jobs";
    default:
      return "/dashboard/company/jobs";
  }
};

export default function CreateJobForm({
  redirectPath,
  onSuccess,
  cancelPath,
}: CreateJobFormProps) {
  const router = useRouter();
  const [createJob, { isLoading, isSuccess, error }] = useCreateJobMutation();

  // Get user role from your auth state
  const user = useSelector((state: any) => state.auth?.user);
  const userRole = user?.role || user?.userType || user?.type;

  // Auto-populate company name for company users
  useEffect(() => {
    if (userRole === "COMPANY" && user) {
      setFormData((prev) => {
        if (!prev.companyName) {
          return {
            ...prev,
            companyName: user.companyName || user.name || "",
          };
        }
        return prev;
      });
    }
  }, [user, userRole]);

  // Helper function removed - using the global getCurrencySymbol function defined above

  // Determine dynamic redirect path
  const dynamicRedirectPath = redirectPath || getRedirectPath(userRole);

  // Use cancelPath prop or default to dynamicRedirectPath
  const finalCancelPath = cancelPath || dynamicRedirectPath;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    jobCode: "",
    companyName: "",
    country: "US",
    compensationType: "ANNUALLY",
    location: "",
    status: "DRAFT",
    salary: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    paymentTerms: "",
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: {
      min: 0,
      max: 0,
    },
    compensationDetails: "",
    replacementTerms: "",
    commission: {
      type: "percentage", // Default to percentage
      originalPercentage: 0,
      fixedAmount: 0, // New field
      hourlyRate: 0, // Add missing hourlyRate property
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
      originalAmount: 0,
      recruiterAmount: 0,
    },
    // Legacy fields
    commissionPercentage: 0,
    commissionAmount: 0,
    description: "",
    companyDescription: "",
    sourcingGuidelines: "",
  });

  // Commission calculation functions
  const calculateRecruiterCommission = (
    originalCommission: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
  ): number => {
    if (originalCommission <= 0) return 0;

    const reduction = (originalCommission * reductionPercentage) / 100;
    const recruiterCommission = originalCommission - reduction;

    return Math.max(
      recruiterCommission,
      COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
    );
  };

  const calculateCommissionAmount = (
    salary: number,
    percentage: number
  ): number => {
    return (salary * percentage) / 100;
  };

  // New function to calculate fixed commission breakdown
  const calculateFixedCommissionBreakdown = (
    fixedAmount: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
  ): { recruiterAmount: number; platformFeeAmount: number } => {
    if (fixedAmount <= 0) return { recruiterAmount: 0, platformFeeAmount: 0 };

    const platformFeeAmount = (fixedAmount * reductionPercentage) / 100;
    const recruiterAmount = fixedAmount - platformFeeAmount;

    return {
      recruiterAmount: Math.max(recruiterAmount, 0),
      platformFeeAmount,
    };
  };

  // Handle form input changes
  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;

    // Handle nested fields (e.g., salary.min, salary.max, salary.currency)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof JobFormData] as object) || {}),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle rich text editor changes
  const handleRichTextChange =
    (field: keyof JobFormData) => (content: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: content,
      }));
    };

  // Handle number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...(typeof formData[parent as keyof JobFormData] === "object" &&
          !Array.isArray(formData[parent as keyof JobFormData])
            ? (formData[parent as keyof JobFormData] as object)
            : {}),
          [child]: value === "" ? 0 : parseFloat(value),
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value === "" ? 0 : parseFloat(value),
      });
    }
  };

  // Handle commission type change
  const handleCommissionTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const commissionType = e.target.value as "percentage" | "fixed" | "hourly";

    setFormData({
      ...formData,
      commission: {
        ...formData.commission,
        type: commissionType,
        // Reset the opposite fields when switching types
        originalPercentage:
          commissionType === "percentage"
            ? formData.commission.originalPercentage
            : 0,
        fixedAmount:
          commissionType === "fixed" ? formData.commission.fixedAmount : 0,
        hourlyRate:
          commissionType === "hourly" ? formData.commission.hourlyRate : 0,
      },
    });
  };

  // Handle commission percentage change
  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalPercentage = parseFloat(e.target.value) || 0;
    const recruiterPercentage = calculateRecruiterCommission(
      originalPercentage,
      formData.commission.reductionPercentage
    );
    const platformFeePercentage = originalPercentage - recruiterPercentage;

    setFormData({
      ...formData,
      commission: {
        ...formData.commission,
        originalPercentage,
        recruiterPercentage,
        platformFeePercentage,
        fixedAmount: 0, // Reset fixed amount when using percentage
      },
      // Update legacy field for backward compatibility
      commissionPercentage: originalPercentage,
    });
  };

  // Handle fixed commission amount change
  const handleFixedCommissionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fixedAmount = parseFloat(e.target.value) || 0;

    setFormData({
      ...formData,
      commission: {
        ...formData.commission,
        fixedAmount,
        originalPercentage: 0, // Reset percentage when using fixed amount
        recruiterPercentage: 0,
        platformFeePercentage: 0,
      },
      // Update legacy field for backward compatibility
      commissionPercentage: 0,
    });
  };

  // Handle hourly commission rate change
  const handleHourlyCommissionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const hourlyRate = parseFloat(e.target.value) || 0;

    setFormData({
      ...formData,
      commission: {
        ...formData.commission,
        hourlyRate,
        originalPercentage: 0, // Reset percentage when using hourly rate
        fixedAmount: 0, // Reset fixed amount when using hourly rate
        recruiterPercentage: 0,
        platformFeePercentage: 0,
      },
      // Update legacy field for backward compatibility
      commissionPercentage: 0,
    });
  };

  // Handle reduction percentage change (for admin/super-admin use)
  const handleReductionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reductionPercentage = Math.min(
      Math.max(
        parseFloat(e.target.value) ||
          COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
        0
      ),
      100
    );

    if (formData.commission.type === "percentage") {
      const recruiterPercentage = calculateRecruiterCommission(
        formData.commission.originalPercentage,
        reductionPercentage
      );
      const platformFeePercentage =
        formData.commission.originalPercentage - recruiterPercentage;

      setFormData({
        ...formData,
        commission: {
          ...formData.commission,
          reductionPercentage,
          recruiterPercentage,
          platformFeePercentage,
        },
      });
    } else {
      // For fixed amount, just update the reduction percentage
      setFormData({
        ...formData,
        commission: {
          ...formData.commission,
          reductionPercentage,
        },
      });
    }
  };

  // Calculate commission amounts based on salary and percentages or fixed amount
  useEffect(() => {
    if (formData.commission.type === "percentage" && formData.salary.max > 0) {
      const originalAmount = calculateCommissionAmount(
        formData.salary.max,
        formData.commission.originalPercentage
      );
      const recruiterAmount = calculateCommissionAmount(
        formData.salary.max,
        formData.commission.recruiterPercentage
      );

      setFormData((prev) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount,
          recruiterAmount,
        },
        // Update legacy field
        commissionAmount: originalAmount,
      }));
    } else if (
      formData.commission.type === "fixed" &&
      formData.commission.fixedAmount > 0
    ) {
      const { recruiterAmount } = calculateFixedCommissionBreakdown(
        formData.commission.fixedAmount,
        formData.commission.reductionPercentage
      );

      setFormData((prev) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount: formData.commission.fixedAmount,
          recruiterAmount,
        },
        // Update legacy field
        commissionAmount: formData.commission.fixedAmount,
      }));
    } else if (
      formData.commission.type === "hourly" &&
      formData.commission.hourlyRate > 0
    ) {
      const { recruiterAmount } = calculateFixedCommissionBreakdown(
        formData.commission.hourlyRate,
        formData.commission.reductionPercentage
      );

      setFormData((prev) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount: formData.commission.hourlyRate,
          recruiterAmount,
        },
        // Update legacy field
        commissionAmount: formData.commission.hourlyRate,
      }));
    }
  }, [
    formData.salary.max,
    formData.commission.originalPercentage,
    formData.commission.recruiterPercentage,
    formData.commission.fixedAmount,
    formData.commission.hourlyRate,
    formData.commission.reductionPercentage,
    formData.commission.type,
  ]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createJob({
        ...formData,
        status: formData.status as JobStatus,
        jobType: formData.jobType as JobType,
      }).unwrap();

      toast.success("Job created successfully!");

      // Get the created job ID from the response
      const jobId = response._id || response.id;

      console.log("Job creation response:", response);
      console.log("Extracted job ID:", jobId);
      console.log("User role:", userRole);

      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else if (jobId) {
        // Redirect to questions page for the newly created job based on user role
        const questionsPath =
          userRole === "INTERNAL"
            ? `/dashboard/internal/jobs/${jobId}/questions`
            : `/dashboard/company/jobs/${jobId}/questions`;

        console.log("Redirecting to:", questionsPath);

        // Try immediate redirect first
        router.refresh(); // Refresh the router state
        router.push(questionsPath);

        // Add fallback with window.location if router.push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== questionsPath) {
            console.log(
              "router.push may have failed, trying window.location..."
            );
            window.location.href = questionsPath;
          }
        }, 1000);
      } else {
        // Fallback if no job ID is found
        console.warn("No job ID found in response, using default redirect");
        toast("Job created but redirecting to jobs list", { icon: "⚠️" });
        const fallbackPath =
          userRole === "INTERNAL"
            ? `/dashboard/internal/jobs`
            : `/dashboard/company/jobs`;
        router.push(fallbackPath);
      }
    } catch (err) {
      toast.error("Failed to create job");
      console.error("Error creating job:", err);
    }
  };

  // Effect for successful job creation (fallback) - disabled to prevent conflicts
  // useEffect(() => {
  //   if (isSuccess && !onSuccess) {
  //     // This effect is mainly for edge cases where the response doesn't include the job ID
  //     // In most cases, the redirect should happen in handleSubmit
  //     router.push(dynamicRedirectPath);
  //   }
  // }, [isSuccess, router, dynamicRedirectPath, onSuccess]);

  // Comprehensive list of currencies with symbols
  const currencies = [
    { code: "USD", name: "US Dollar (USD)" },
    { code: "EUR", name: "Euro (EUR)" },
    { code: "GBP", name: "British Pound (GBP)" },
    { code: "JPY", name: "Japanese Yen (JPY)" },
    { code: "AUD", name: "Australian Dollar (AUD)" },
    { code: "CAD", name: "Canadian Dollar (CAD)" },
    { code: "CHF", name: "Swiss Franc (CHF)" },
    { code: "CNY", name: "Chinese Yuan (CNY)" },
    { code: "HKD", name: "Hong Kong Dollar (HKD)" },
    { code: "NZD", name: "New Zealand Dollar (NZD)" },
    { code: "SEK", name: "Swedish Krona (SEK)" },
    { code: "KRW", name: "South Korean Won (KRW)" },
    { code: "SGD", name: "Singapore Dollar (SGD)" },
    { code: "NOK", name: "Norwegian Krone (NOK)" },
    { code: "MXN", name: "Mexican Peso (MXN)" },
    { code: "INR", name: "Indian Rupee (INR)" },
    { code: "RUB", name: "Russian Ruble (RUB)" },
    { code: "ZAR", name: "South African Rand (ZAR)" },
    { code: "BRL", name: "Brazilian Real (BRL)" },
    { code: "AED", name: "UAE Dirham (AED)" },
    { code: "SAR", name: "Saudi Riyal (SAR)" },
    { code: "TRY", name: "Turkish Lira (TRY)" },
    { code: "THB", name: "Thai Baht (THB)" },
    { code: "IDR", name: "Indonesian Rupiah (IDR)" },
    { code: "PHP", name: "Philippine Peso (PHP)" },
    { code: "MYR", name: "Malaysian Ringgit (MYR)" },
    { code: "VND", name: "Vietnamese Dong (VND)" },
    { code: "EGP", name: "Egyptian Pound (EGP)" },
    { code: "PKR", name: "Pakistani Rupee (PKR)" },
    { code: "BDT", name: "Bangladeshi Taka (BDT)" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  // List of job types
  const jobTypes = [
    { value: "FULL_TIME", label: "Full Time" },
    { value: "PART_TIME", label: "Part Time" },
    { value: "CONTRACT", label: "Contract" },
    { value: "FREELANCE", label: "Freelance" },
    { value: "INTERNSHIP", label: "Internship" },
  ];

  // Comprehensive list of countries
  const countries = [
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

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Post a New Job</h2>
        <p className="text-gray-600 mt-1">
          Fill in the details to create a new job posting
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details - First Frame */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Job Details
          </h3>

          {/* Row 1: Job Title & Job Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Code (Auto-generated if left empty)
              </label>
              <input
                type="text"
                name="jobCode"
                value={formData.jobCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 1.5: Company Name - Only show for internal and admin users */}
          {(userRole === "INTERNAL" || userRole === "ADMIN") && (
            <div className="grid grid-cols-1 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name*
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Enter the company name for this job posting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Row 2: Experience Min-Max */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Experience (Years)*
              </label>
              <input
                type="number"
                name="experienceLevel.min"
                value={formData.experienceLevel.min || ""}
                onChange={handleNumberChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Experience (Years)*
              </label>
              <input
                type="number"
                name="experienceLevel.max"
                value={formData.experienceLevel.max || ""}
                onChange={handleNumberChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <CountrySelector
                value={uniqueCountries.find((c) => c.code === formData.country)?.name || ""}
                onValueChange={(countryName: string) => {
                  const selectedCountry = uniqueCountries.find(
                    (c) => c.name === countryName
                  );
                  if (selectedCountry) {
                    setFormData((prev) => ({
                      ...prev,
                      country: selectedCountry.code,
                      salary: {
                        ...prev.salary,
                        currency: selectedCountry.currencyCode || "USD",
                      },
                    }));
                  }
                }}
                placeholder="Select a country"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location*
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="City or 'Remote'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Salary Range Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Salary range
              </label>

              {/* Single Row Layout: Toggle Buttons + Salary Inputs + Currency */}
              <div className="flex items-center space-x-4">
                {/* Time Period Toggle Buttons */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        compensationType: "HOURLY",
                      }))
                    }
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      formData.compensationType === "HOURLY"
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        compensationType: "MONTHLY",
                      }))
                    }
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      formData.compensationType === "MONTHLY"
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        compensationType: "ANNUALLY",
                      }))
                    }
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      formData.compensationType === "ANNUALLY"
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Annual
                  </button>
                </div>

                {/* Salary Range Inputs */}
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="number"
                    name="salary.min"
                    value={formData.salary.min || ""}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="flex-1 px-4 py-1 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="1,300,000"
                  />

                  <span className="text-gray-500 font-medium text-sm">to</span>

                  <input
                    type="number"
                    name="salary.max"
                    value={formData.salary.max || ""}
                    onChange={handleNumberChange}
                    required
                    min={formData.salary.min || 0}
                    className="flex-1 px-4 py-1 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="3,000,000"
                  />
                </div>

                {/* Currency Selector - Wider */}
                <div className="w-80">
                  <Select
                    value={formData.salary.currency}
                    onValueChange={(value: string) => {
                      setFormData((prev) => ({
                        ...prev,
                        salary: {
                          ...prev.salary,
                          currency: value,
                        },
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full min-w-48 h-12 px-4 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue>
                        {formData.salary.currency ? (
                          (() => {
                            const selectedCurrency = uniqueCurrencies.find(
                              (c) => c.code === formData.salary.currency
                            );
                            if (!selectedCurrency) return "Select";
                            // Display symbol and currency name
                            const symbol =
                              selectedCurrency.symbol &&
                              selectedCurrency.symbol !== selectedCurrency.code
                                ? selectedCurrency.symbol
                                : selectedCurrency.code;
                            return (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg">
                                  {symbol}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {selectedCurrency.code}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">Currency</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] w-48 overflow-y-auto">
                      {uniqueCurrencies.map((currency) => {
                        // Display symbol and currency name
                        const symbol =
                          currency.symbol && currency.symbol !== currency.code
                            ? currency.symbol
                            : currency.code;
                        return (
                          <SelectItem
                            key={currency.code}
                            value={currency.code}
                            hideIndicator={
                              formData.salary.currency !== currency.code
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{symbol}</span>
                              <span className="text-gray-500 text-sm">
                                {currency.name}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compensation Details
            </label>
            <input
              type="text"
              name="compensationDetails"
              value={formData.compensationDetails}
              onChange={handleChange}
              placeholder="Include details about bonuses, benefits, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Row 5: Number of Positions, Job Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Positions*
              </label>
              <input
                type="number"
                name="positions"
                value={formData.positions || ""}
                onChange={handleNumberChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type*
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {jobTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Status*
              </label>
              <div className="flex space-x-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={formData.status === "ACTIVE"}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="DRAFT"
                    checked={formData.status === "DRAFT"}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Draft</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Details - Updated Second Frame */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Commission Details
          </h3>

          {/* Commission Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Type*
            </label>
            <div className="flex space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commission.type"
                  value="percentage"
                  checked={formData.commission.type === "percentage"}
                  onChange={handleCommissionTypeChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Percentage-based
                </span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commission.type"
                  value="fixed"
                  checked={formData.commission.type === "fixed"}
                  onChange={handleCommissionTypeChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Fixed Amount</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commission.type"
                  value="hourly"
                  checked={formData.commission.type === "hourly"}
                  onChange={handleCommissionTypeChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Hourly Rate</span>
              </label>
            </div>
          </div>

          {/* Commission Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {formData.commission.type === "percentage" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Percentage (%)*
                </label>
                <input
                  type="number"
                  name="commission.originalPercentage"
                  value={formData.commission.originalPercentage || ""}
                  onChange={handleCommissionChange}
                  required
                  min={COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}
                  max={COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ) : formData.commission.type === "fixed" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Commission Amount*
                </label>
                <input
                  type="number"
                  name="commission.fixedAmount"
                  value={formData.commission.fixedAmount || ""}
                  onChange={handleFixedCommissionChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Commission Rate*
                </label>
                <input
                  type="number"
                  name="commission.hourlyRate"
                  value={formData.commission.hourlyRate || ""}
                  onChange={handleHourlyCommissionChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Commission Amount
              </label>
              <input
                type="number"
                value={formData.commission.originalAmount || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
                placeholder={
                  formData.commission.type === "percentage"
                    ? "Auto-calculated based on max salary and percentage"
                    : formData.commission.type === "fixed"
                    ? "Fixed amount entered above"
                    : "Hourly rate entered above"
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                placeholder="e.g., Monthly, Bi-weekly"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replacement Terms
              </label>
              <input
                type="text"
                name="replacementTerms"
                value={formData.replacementTerms}
                onChange={handleChange}
                placeholder="Specify any replacement guarantees or policies"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Job Descriptions - Updated with Rich Text Editor */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Job Descriptions
          </h3>

          <div className="space-y-6">
            {/* Job Description with Rich Text Editor */}
            <div>
              <RichTextEditor
                label="Job Description"
                value={formData.description}
                onChange={handleRichTextChange("description")}
                required={true}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            {/* Company Description with Rich Text Editor */}
            <div>
              <RichTextEditor
                label="Company Description"
                value={formData.companyDescription}
                onChange={handleRichTextChange("companyDescription")}
                required={false}
                placeholder="Brief description of your company..."
              />
            </div>

            {/* Sourcing Guidelines with Rich Text Editor */}
            <div>
              <RichTextEditor
                label="Sourcing Guidelines"
                value={formData.sourcingGuidelines}
                onChange={handleRichTextChange("sourcingGuidelines")}
                required={false}
                placeholder="Specific instructions for recruiters on candidate sourcing..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(finalCancelPath)}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
