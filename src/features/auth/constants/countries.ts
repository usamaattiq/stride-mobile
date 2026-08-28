export type CountryOption = {
  code: string;
  callingCode: string;
  name: string;
  flag: string;
  currency: string;
};

export const DEFAULT_COUNTRY: CountryOption = {
  code: 'PK',
  callingCode: '92',
  name: 'Pakistan',
  flag: '🇵🇰',
  currency: 'PKR',
};

export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  DEFAULT_COUNTRY,
  { code: 'SA', callingCode: '966', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR' },
  { code: 'AE', callingCode: '971', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED' },
  { code: 'US', callingCode: '1', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', callingCode: '44', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'IN', callingCode: '91', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'EG', callingCode: '20', name: 'Egypt', flag: '🇪🇬', currency: 'EGP' },
  { code: 'JO', callingCode: '962', name: 'Jordan', flag: '🇯🇴', currency: 'JOD' },
  { code: 'QA', callingCode: '974', name: 'Qatar', flag: '🇶🇦', currency: 'QAR' },
  { code: 'KW', callingCode: '965', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD' },
] as const;

export function findCountryByCode(code: string): CountryOption | undefined {
  return COUNTRY_OPTIONS.find((option) => option.code === code);
}

export function findCountryByCallingCode(callingCode: string): CountryOption | undefined {
  const normalized = callingCode.replace(/^\+/, '');
  return COUNTRY_OPTIONS.find((option) => option.callingCode === normalized);
}

export function currencyForCountry(
  countryCode?: string | null,
  countryCallingCode?: string | null,
): string {
  const byCode = countryCode ? findCountryByCode(countryCode.toUpperCase()) : undefined;
  if (byCode) {
    return byCode.currency;
  }
  const byCalling = countryCallingCode
    ? findCountryByCallingCode(countryCallingCode)
    : undefined;
  return byCalling?.currency ?? DEFAULT_COUNTRY.currency;
}
