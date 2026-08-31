import type { PhoneIdentity } from '@/services/api/authApi.types';

export const ADMIN_PHONE_E164 = '+923211122334';

export function toPhoneE164(identity: PhoneIdentity): string {
  const callingCode = identity.countryCallingCode.replace(/^\+/, '');
  return `+${callingCode}${identity.phoneDigits}`;
}

export function isAdminPhone(identity: PhoneIdentity): boolean {
  return toPhoneE164(identity) === ADMIN_PHONE_E164;
}

export function isAdminPhoneE164(phoneE164: string): boolean {
  return phoneE164 === ADMIN_PHONE_E164;
}
