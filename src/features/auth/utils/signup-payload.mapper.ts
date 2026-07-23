import type { SignupSubmitPayload } from '@/services/api/authApi.types';

import type { SignupDraft } from '../types/signup.types';

/**
 * File uploads (avatar/NIC photos → S3) aren't wired yet, so `nicNumber` must be
 * dropped along with the URL fields — the backend 400s if a NIC number is present
 * without both NIC image URLs.
 */
export function toSignupSubmitPayload(draft: SignupDraft, deviceId: string): SignupSubmitPayload {
  return {
    countryCode: draft.country.code,
    countryCallingCode: draft.country.callingCode,
    phoneDigits: draft.phoneDigits,
    fullName: draft.fullName.trim(),
    email: draft.email.trim() || undefined,
    address: draft.address.trim() || undefined,
    locationCoordinates: draft.locationCoords,
    mpin: draft.mpin,
    biometricEnabled: draft.biometricEnabled,
    deviceId,
  };
}
