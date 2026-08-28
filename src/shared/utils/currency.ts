import { currencyForCountry } from '@/features/auth/constants/countries';
import { useProfileStore } from '@/store/profileStore';

import { formatPriceAmount } from './latin-digits';

const CURRENCY_PREFIX = /^\s*(AED|EGP|GBP|INR|JOD|KWD|PKR|QAR|SAR|USD)\s+/i;

export function getDisplayCurrency(): string {
  const profile = useProfileStore.getState().profile;
  return currencyForCountry(profile?.countryCode, profile?.countryCallingCode);
}

export function useDisplayCurrency(): string {
  const profile = useProfileStore((state) => state.profile);
  return currencyForCountry(profile?.countryCode, profile?.countryCallingCode);
}

export function stripCurrencyPrefix(value: string): string {
  return value.replace(CURRENCY_PREFIX, '').trim();
}

/** Amount with the currency for the signed-in user's phone country. */
export function formatPriceWithCurrency(
  value: string | number | null | undefined,
): string {
  const amount = formatPriceAmount(
    typeof value === 'string' ? stripCurrencyPrefix(value) : value,
  );
  if (!amount) {
    return '';
  }
  return `${getDisplayCurrency()} ${amount}`;
}
