import { CheckIcon, ChevronsUpDown } from "lucide-react";

import * as React from "react";

import * as RPNInput from "react-phone-number-input";

import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input, InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";
import { getCountriesOptions } from "./phone-input-helpers";

const PhoneInput = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  React.ComponentPropsWithoutRef<typeof RPNInput.default>
>(({ className, onChange, ...props }, ref) => {
  // Create wrapped components that receive the className
  const WrappedInputComponent = React.useMemo(
    () =>
      React.forwardRef<
        React.ElementRef<typeof Input>,
        React.ComponentPropsWithoutRef<typeof Input>
      >(({ className: inputClassName, ...inputProps }, inputRef) => (
        <Input
          className={cn(
            "rounded-e-lg rounded-s-none",
            className,
            inputClassName
          )}
          {...inputProps}
          ref={inputRef}
        />
      )),
    [className]
  );

  const WrappedCountrySelect = React.useMemo(
    () => (props: CountrySelectProps) =>
      <CountrySelect {...props} className={cn(className, "w-auto")} />,
    [className]
  );

  return (
    <RPNInput.default
      ref={ref}
      className={cn("flex", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={WrappedCountrySelect}
      inputComponent={WrappedInputComponent}
      /**
       * Handles the onChange event.
       *
       * react-phone-number-input might trigger the onChange event as undefined
       * when a valid phone number is not entered. To prevent this,
       * the value is coerced to an empty string.
       *
       * @param {E164Number | undefined} value - The entered value
       */
      onChange={(value) => onChange?.(value || "")}
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-e-lg rounded-s-none", className)}
    {...props}
    ref={ref}
  />
));
InputComponent.displayName = "InputComponent";

type CountrySelectProps = {
  disabled?: boolean;
  value?: RPNInput.Country;
  onChange?: (country: RPNInput.Country) => void;
  options?: Array<{
    value?: RPNInput.Country;
    label: string;
  }>;
  className?: string;
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
  className,
}: CountrySelectProps) => {
  const [countriesOptions, setCountriesOptions] = React.useState<
    Array<{
      value: RPNInput.Country;
      label: string;
      indicatif: string;
    }>
  >([]);

  React.useEffect(() => {
    const loadCountries = () => {
      try {
        const countries = getCountriesOptions();
        setCountriesOptions(countries);
      } catch (error) {
        console.error("Failed to load countries:", error);
      }
    };
    loadCountries();
  }, []);

  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange?.(country);
    },
    [onChange]
  );

  React.useEffect(() => {
    if (!value) {
      handleSelect("IN");
    }
  }, [handleSelect, value]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "flex gap-1 rounded-e-none border-b-2 border-r-2 border-[#F2F2F2] rounded-s-lg px-3",
            "bg-[#CEEAF8] dark:bg-gray-700",
            className
          )}
          disabled={disabled}
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDown
            className={cn(
              "-mr-2 h-4  opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput placeholder="Search country..." />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countriesOptions
                  ?.filter((x) => x.value)
                  .map((option) => (
                    <CommandItem
                      className="gap-2"
                      key={option.value}
                      onSelect={() => handleSelect(option.value!)}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      {option.value && (
                        <span className="text-foreground/50 text-sm">
                          {option.indicatif}
                        </span>
                      )}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          option.value === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type FlagComponentProps = {
  country?: RPNInput.Country;
  countryName?: string;
};

const FlagComponent = ({ country, countryName }: FlagComponentProps) => {
  const Flag = flags[country as keyof typeof flags];

  return (
    <span className="bg-foreground/20 flex h-4 w-6 overflow-hidden rounded-sm">
      {Flag && <Flag title={countryName || ""} />}
    </span>
  );
};
FlagComponent.displayName = "FlagComponent";

export { PhoneInput };
