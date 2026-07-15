export type CountryOption = {
  code: string;
  callingCode: string;
  name: string;
  flag: string;
};

export const DEFAULT_COUNTRY: CountryOption = {
  code: 'PK',
  callingCode: '92',
  name: 'Pakistan',
  flag: '🇵🇰',
};

export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  DEFAULT_COUNTRY,
  { code: 'SA', callingCode: '966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', callingCode: '971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', callingCode: '1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', callingCode: '44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', callingCode: '91', name: 'India', flag: '🇮🇳' },
  { code: 'EG', callingCode: '20', name: 'Egypt', flag: '🇪🇬' },
  { code: 'JO', callingCode: '962', name: 'Jordan', flag: '🇯🇴' },
  { code: 'QA', callingCode: '974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', callingCode: '965', name: 'Kuwait', flag: '🇰🇼' },
] as const;
