import { useMemo } from "react";
import { CountryCode } from "libphonenumber-js";
import { getCountryOptions, getCountryFlag } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PhoneInputFieldProps {
  label: string;
  countryCode: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

export function PhoneInputField({
  label,
  countryCode,
  onCountryChange,
  phone,
  onPhoneChange,
  error,
  required = true,
  disabled = false,
  id = "phone",
  placeholder,
}: PhoneInputFieldProps) {
  const countryOptions = useMemo(() => getCountryOptions(), []);

  return (
    <div className="w-full space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex rounded-lg border border-border bg-white transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden">
        {/* Country Code Dropdown */}
        <div className="relative flex items-center bg-muted/30 border-r border-border min-w-[100px] sm:min-w-[110px]">
          <select
            aria-label="Country Code"
            disabled={disabled}
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value as CountryCode)}
            className="w-full h-11 pl-2.5 pr-6 bg-transparent text-sm font-medium text-foreground cursor-pointer outline-none appearance-none truncate"
          >
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.callingCode})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
            ▼
          </div>
        </div>

        {/* Phone Number Input */}
        <input
          id={id}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={placeholder || (countryCode === "IN" ? "98765 43210" : "Phone number")}
          className={cn(
            "flex-1 h-11 px-3 text-sm text-foreground bg-transparent outline-none",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive font-medium mt-1 animate-in fade-in-50 duration-150">
          {error}
        </p>
      )}
    </div>
  );
}
