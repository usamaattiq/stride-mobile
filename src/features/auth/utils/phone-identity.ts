import type { PhoneIdentity } from '@/services/api/authApi.types';

import type { CountryOption } from '../constants/countries';
import { DEFAULT_COUNTRY } from '../constants/countries';

/** Fallback national number length when no country is known (Pakistan). */
export const LOCAL_PHONE_DIGIT_LENGTH = DEFAULT_COUNTRY.phoneDigitLength;

/**
 * Keeps typed digits, including a leading 0, up to `digitLength + 1` characters.
 */
export function sanitizeLocalPhoneInput(
  digits: string,
  digitLength: number = LOCAL_PHONE_DIGIT_LENGTH,
): string {
  const raw = digits.replace(/\D/g, '');
  if (raw.startsWith('0')) {
    return raw.slice(0, digitLength + 1);
  }
  return raw.slice(0, digitLength);
}

/**
 * Strips a leading trunk 0 so +92 0300… and +92 300… store as the same number.
 */
export function normalizeLocalPhoneDigits(
  digits: string,
  digitLength: number = LOCAL_PHONE_DIGIT_LENGTH,
): string {
  return digits.replace(/^0+/, '').slice(0, digitLength);
}

export function isLocalPhoneComplete(
  digits: string,
  digitLength: number = LOCAL_PHONE_DIGIT_LENGTH,
): boolean {
  return normalizeLocalPhoneDigits(digits, digitLength).length === digitLength;
}

export function toPhoneIdentity(country: CountryOption, phoneDigits: string): PhoneIdentity {
  return {
    countryCallingCode: country.callingCode,
    phoneDigits: normalizeLocalPhoneDigits(phoneDigits, country.phoneDigitLength),
    countryCode: country.code,
  };
}
