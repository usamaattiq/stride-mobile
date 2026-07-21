import type { PhoneIdentity } from '@/services/api/authApi.types';

import type { CountryOption } from '../constants/countries';

export function toPhoneIdentity(country: CountryOption, phoneDigits: string): PhoneIdentity {
  return {
    countryCallingCode: country.callingCode,
    phoneDigits,
    countryCode: country.code,
  };
}
