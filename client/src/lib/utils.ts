import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format as +X XXX XXX XXXX
  if (cleaned.length > 1) {
    const countryCode = cleaned.slice(0, cleaned.indexOf(' ') > 0 ? cleaned.indexOf(' ') : 2);
    const rest = cleaned.slice(countryCode.length);
    
    if (rest.length <= 3) return `${countryCode} ${rest}`;
    if (rest.length <= 6) return `${countryCode} ${rest.slice(0, 3)} ${rest.slice(3)}`;
    return `${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
  }
  
  return cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
