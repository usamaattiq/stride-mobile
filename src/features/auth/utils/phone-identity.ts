import type { PhoneIdentity } from '@/services/api/authApi.types';

import type { CountryOption } from '../constants/countries';

/** National number length after dropping a trunk prefix (e.g. 0). */
export const LOCAL_PHONE_DIGIT_LENGTH = 10;

/** Users may type a leading 0; that extra digit is not stored. */
const LOCAL_PHONE_INPUT_MAX = LOCAL_PHONE_DIGIT_LENGTH + 1;

/**
 * Keeps typed digits, including a leading 0, up to 11 characters.
 */
export function sanitizeLocalPhoneInput(digits: string): string {
  const raw = digits.replace(/\D/g, '');
  if (raw.startsWith('0')) {
    return raw.slice(0, LOCAL_PHONE_INPUT_MAX);
  }
  return raw.slice(0, LOCAL_PHONE_DIGIT_LENGTH);
}

/**
 * Strips a leading trunk 0 so +92 0300… and +92 300… store as the same number.
 */
export function normalizeLocalPhoneDigits(digits: string): string {
  return digits.replace(/^0+/, '').slice(0, LOCAL_PHONE_DIGIT_LENGTH);
}

export function isLocalPhoneComplete(digits: string): boolean {
  return normalizeLocalPhoneDigits(digits).length === LOCAL_PHONE_DIGIT_LENGTH;
}

export function toPhoneIdentity(country: CountryOption, phoneDigits: string): PhoneIdentity {
  return {
    countryCallingCode: country.callingCode,
    phoneDigits: normalizeLocalPhoneDigits(phoneDigits),
    countryCode: country.code,
  };
}
