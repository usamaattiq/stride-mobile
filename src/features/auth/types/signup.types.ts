import type { CountryOption } from '../constants/countries';
import { DEFAULT_COUNTRY } from '../constants/countries';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type SignupDraft = {
  country: CountryOption;
  phoneDigits: string;
  otp: string;
  fullName: string;
  email: string;
  address: string;
  locationCoords: LocationCoords | null;
  profilePhotoUri: string | null;
  nicNumber: string;
  nicFrontUri: string | null;
  nicBackUri: string | null;
  mpin: string;
  mpinConfirm: string;
  biometricEnabled: boolean;
};

export const createEmptySignupDraft = (): SignupDraft => ({
  country: DEFAULT_COUNTRY,
  phoneDigits: '',
  otp: '',
  fullName: '',
  email: '',
  address: '',
  locationCoords: null,
  profilePhotoUri: null,
  nicNumber: '',
  nicFrontUri: null,
  nicBackUri: null,
  mpin: '',
  mpinConfirm: '',
  biometricEnabled: false,
});

export function formatPhoneDisplay(country: CountryOption, digits: string): string {
  const normalized = digits.replace(/^0+/, '');
  const a = normalized.slice(0, 3);
  const b = normalized.slice(3);
  const local = b ? `${a} ${b}` : a;
  return `+${country.callingCode} ${local}`.trim();
}
