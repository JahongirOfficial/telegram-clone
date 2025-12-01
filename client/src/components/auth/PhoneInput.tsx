import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Phone } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value: _value,
  onChange,
  error,
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange(country.dialCode + phoneNumber.replace(/\s/g, ''));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
    onChange(selectedCountry.dialCode + input);
  };

  const formatPhoneNumber = (phone: string): string => {
    if (phone.length <= 2) return phone;
    if (phone.length <= 5) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
    if (phone.length <= 8) return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
    return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)}`;
  };

  return (
    <div className="w-full">
      <label className="block text-xs sm:text-sm font-medium text-telegram-text-secondary mb-1.5 sm:mb-2">
        Phone Number
      </label>
      <div className="relative flex gap-1.5 sm:gap-2">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl',
              'bg-telegram-bg-light border border-telegram-border',
              'hover:bg-telegram-bg-lighter transition-colors',
              'focus:outline-none focus:border-telegram-blue',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-lg sm:text-xl">{selectedCountry.flag}</span>
            <span className="text-white font-medium text-sm sm:text-base">{selectedCountry.dialCode}</span>
            <ChevronDown className={cn(
              'w-3 h-3 sm:w-4 sm:h-4 text-telegram-text-secondary transition-transform',
              isOpen && 'rotate-180'
            )} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 max-h-52 sm:max-h-60 overflow-y-auto rounded-xl bg-telegram-bg-light border border-telegram-border shadow-xl z-50 animate-fade-in">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    'w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-telegram-bg-lighter transition-colors',
                    selectedCountry.code === country.code && 'bg-telegram-bg-lighter'
                  )}
                >
                  <span className="text-lg sm:text-xl">{country.flag}</span>
                  <span className="text-white flex-1 text-left text-sm sm:text-base">{country.name}</span>
                  <span className="text-telegram-text-secondary text-xs sm:text-sm">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-telegram-text-secondary" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="XX XXX XX XX"
            disabled={disabled}
            className={cn(
              'w-full bg-telegram-bg-light border border-telegram-border rounded-xl',
              'pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white placeholder-telegram-text-secondary',
              'focus:outline-none focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue',
              'transition-all duration-200 text-sm sm:text-base',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-500 animate-fade-in">{error}</p>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
