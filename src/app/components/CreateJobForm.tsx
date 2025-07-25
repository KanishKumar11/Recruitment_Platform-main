"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import CountryList from 'country-list-with-dial-code-and-flag';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Clock, DollarSign, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelector } from 'react-redux';
import { countries } from '@/lib/countries';
import { currencies } from '@/lib/currencies';
import { useCreateJobMutation } from "@/app/store/services/jobsApi";
import { JobStatus } from "../constants/jobStatus";
import { JobType } from "../constants/jobType";
import RichTextEditor from "./RichTextEditor";

// Define proper types for country and currency
type CountryType = {
  code: string;
  name: string;
  emoji: string;
  currencyCode: string;
  phoneCode: string;
};

type CurrencyType = {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  rounding: number;
  namePlural: string;
};

// Define the Country interface from the package
type Country = {
  name: string;
  code: string;
  dial_code: string;
  currency: string;
  flag: string;
};

// Get all countries from the package
const allCountries: Country[] = CountryList.getAll();

// Create a map of currency code to countries that use it
const currencyToCountriesMap = allCountries.reduce<Record<string, Country[]>>((acc, country) => {
  const currency = country.currency;
  if (currency) {
    if (!acc[currency]) {
      acc[currency] = [];
    }
    acc[currency].push(country);
  }
  return acc;
}, {});

// Get unique currencies with their details
const uniqueCurrencies = Object.entries(
  allCountries.reduce<Record<string, CurrencyType>>((acc, country) => {
    const currencyCode = country.currency;
    if (currencyCode && !acc[currencyCode]) {
      acc[currencyCode] = {
        code: currencyCode,
        name: currencyCode, // Using code as fallback name
        symbol: currencyCode, // Using code as fallback symbol
        symbolNative: currencyCode, // Using code as fallback native symbol
        decimalDigits: 2,
        rounding: 0,
        namePlural: `${currencyCode}s`
      };
    }
    return acc;
  }, {})
).map(([_, currency]) => currency);

// Map to our CountryType
const countryList: CountryType[] = allCountries.map(country => ({
  code: country.code,
  name: country.name,
  emoji: country.flag,
  currencyCode: country.currency || 'USD', // Default to USD if no currency
  phoneCode: country.dial_code.replace(/\D/g, '') // Remove non-numeric characters
}));

const currencyList: CurrencyType[] = uniqueCurrencies;

// Commission configuration
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 40,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
};

// Define types for form data
interface JobFormData {
  title: string;
  jobCode: string;
  country: string;
  compensationType: 'MONTHLY' | 'ANNUALLY';
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
    type: "percentage" | "fixed"; 
    originalPercentage: number;
    fixedAmount: number; 
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

  // Determine dynamic redirect path
  const dynamicRedirectPath = redirectPath || getRedirectPath(userRole);

  // Use cancelPath prop or default to dynamicRedirectPath
  const finalCancelPath = cancelPath || dynamicRedirectPath;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    jobCode: "",
    country: "US", 
    compensationType: 'ANNUALLY',
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    
    // Handle nested fields (e.g., salary.min, salary.max, salary.currency)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof JobFormData] as object || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle rich text editor changes
  const handleRichTextChange =
    (field: keyof JobFormData) => (content: string) => {
      setFormData({
        ...formData,
        [field]: content,
      });
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
    const commissionType = e.target.value as "percentage" | "fixed";

    setFormData({
      ...formData,
      commission: {
        ...formData.commission,
        type: commissionType,
        // Reset the opposite field when switching types
        originalPercentage:
          commissionType === "percentage"
            ? formData.commission.originalPercentage
            : 0,
        fixedAmount:
          commissionType === "fixed" ? formData.commission.fixedAmount : 0,
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
    }
  }, [
    formData.salary.max,
    formData.commission.originalPercentage,
    formData.commission.recruiterPercentage,
    formData.commission.fixedAmount,
    formData.commission.reductionPercentage,
    formData.commission.type,
  ]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob({
        ...formData,
        status: formData.status as JobStatus,
        jobType: formData.jobType as JobType,
      }).unwrap();
      toast.success("Job created successfully!");

      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Use the dynamic redirect path
        router.push(dynamicRedirectPath);
      }
    } catch (err) {
      toast.error("Failed to create job");
      console.error("Error creating job:", err);
    }
  };

  // Effect for successful job creation (fallback)
  useEffect(() => {
    if (isSuccess && !onSuccess) {
      router.push(dynamicRedirectPath);
    }
  }, [isSuccess, router, dynamicRedirectPath, onSuccess]);

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
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
    "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
    "Remote"
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
                <Select
                  value={formData.country}
                  onValueChange={(value: string) => {
                    const selectedCountry = countryList.find(c => c.code === value);
                    if (selectedCountry) {
                      setFormData(prev => ({
                        ...prev,
                        country: value,
                        salary: {
                          ...prev.salary,
                          currency: selectedCountry.currencyCode || 'USD'
                        }
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country">
                      {formData.country ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {allCountries.find(c => c.code === formData.country)?.flag || '🌐'}
                          </span>
                          <span>
                            {allCountries.find(c => c.code === formData.country)?.name || 'Select a country'}
                          </span>
                        </div>
                      ) : 'Select a country'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] overflow-y-auto">
                    {allCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          <span className="flex-1">{country.name}</span>
                          <span className="text-xs text-gray-500">{country.dial_code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <Select
                  value={formData.salary.currency}
                  onValueChange={(value: string) => {
                    setFormData(prev => ({
                      ...prev,
                      salary: {
                        ...prev.salary,
                        currency: value
                      }
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {formData.salary.currency ? (() => {
                        const selectedCurrency = currencyList.find(c => c.code === formData.salary.currency);
                        if (!selectedCurrency) return 'Select a currency';
                        const countriesUsingThisCurrency = currencyToCountriesMap[selectedCurrency.code] || [];
                        const flag = countriesUsingThisCurrency[0]?.flag || '💱';
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{flag}</span>
                            <span className="font-mono">{selectedCurrency.symbol}</span>
                            {/* <span>{selectedCurrency.code}</span> */}
                          </div>
                        );
                      })() : 'Select a currency'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] overflow-y-auto">
                    {currencyList.map((currency) => {
                      const countriesUsingThisCurrency = currencyToCountriesMap[currency.code] || [];
                      const flag = countriesUsingThisCurrency[0]?.flag || '💱';
                      return (
                        <SelectItem 
                          key={currency.code} 
                          value={currency.code}
                          hideIndicator={formData.salary.currency !== currency.code}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{flag}</span>
                            <span className="font-mono">{currency.symbol}</span>
                            {/* <span className="flex-1">{currency.code}</span> */}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compensation Type*
                </label>
                <div className="mt-1 flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="compensationType"
                      value="MONTHLY"
                      checked={formData.compensationType === 'MONTHLY'}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        compensationType: 'MONTHLY'
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Monthly</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="compensationType"
                      value="ANNUALLY"
                      checked={formData.compensationType === 'ANNUALLY'}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        compensationType: 'ANNUALLY'
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Annually</span>
                  </label>
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
            ) : (
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
                    : "Fixed amount entered above"
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
