export type UserProfileDto = {
  id: string;
  fullName: string;
  phoneE164: string;
  countryCode: string;
  countryCallingCode: string;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
  avatarViewUrl?: string | null;
  nicNumber: string | null;
  nicFrontUrl: string | null;
  nicFrontViewUrl?: string | null;
  nicBackUrl: string | null;
  nicBackViewUrl?: string | null;
  driverLicenseNumber: string | null;
  driverLicenseFrontUrl: string | null;
  driverLicenseFrontViewUrl?: string | null;
  driverLicenseBackUrl: string | null;
  driverLicenseBackViewUrl?: string | null;
  role: 'passenger' | 'driver';
  biometricEnabled: boolean;
  credits: number;
  isVerified: boolean;
  hasMpin: boolean;
};

export type AuthLoginResult = {
  accessToken: string;
  profile: UserProfileDto;
};

export type AuthSignupResult = {
  userId: string;
  accessToken: string;
  profile: UserProfileDto;
};

export type PhoneIdentity = {
  countryCallingCode: string;
  phoneDigits: string;
  countryCode: string;
};

export type LoginOtpPurpose = 'login' | 'mpin_reset';

export type SignupSubmitPayload = PhoneIdentity & {
  fullName: string;
  email?: string;
  address?: string;
  locationCoordinates?: { latitude: number; longitude: number } | null;
  mpin: string;
  biometricEnabled: boolean;
  deviceId: string;
  avatarUrl?: string;
  nicNumber?: string;
  nicFrontUrl?: string;
  nicBackUrl?: string;
};

export type BecomeDriverPayload = {
  licenseNumber: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
  deviceId: string;
};

