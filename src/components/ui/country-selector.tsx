"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = "Select a country",
  className,
  disabled = false,
}: CountrySelectorProps) {
  // Create unique countries list from the countries data
  const uniqueCountries = countries
    .map((item) => ({
      code: item.code,
      name: item.name,
      image: item.image || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value ? (
            <div className="flex items-center gap-2">
              {(() => {
                const selectedCountry = uniqueCountries.find(
                  (c) => c.name === value
                );
                return selectedCountry ? (
                  <>
                    {selectedCountry.image && (
                      <img 
                        src={selectedCountry.image} 
                        alt={`${selectedCountry.name} flag`}
                        className="w-5 h-4 object-cover rounded-sm"
                      />
                    )}
                    <span>{selectedCountry.name}</span>
                  </>
                ) : (
                  <span>{value}</span>
                );
              })()}
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px] overflow-y-auto">
        {uniqueCountries.map((country) => (
          <SelectItem key={country.code} value={country.name}>
            <div className="flex items-center gap-2">
              {country.image && (
                <img 
                  src={country.image} 
                  alt={`${country.name} flag`}
                  className="w-5 h-4 object-cover rounded-sm"
                />
              )}
              <span className="flex-1">{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default CountrySelector;
