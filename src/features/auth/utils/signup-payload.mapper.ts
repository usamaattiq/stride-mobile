import type { SignupSubmitPayload } from '@/services/api/authApi.types';
import { uploadLocalFileToPresignedUrl } from '@/shared/services/mediaUploadService';

import type { SignupDraft } from '../types/signup.types';
import { toPhoneIdentity } from './phone-identity';

/**
 * Uploads signup media (avatar / NIC) via presigned URLs, then builds the submit payload.
 * Persist only stable `fileUrl` values — never uploadUrl / viewUrl.
 */
export async function toSignupSubmitPayload(
  draft: SignupDraft,
  deviceId: string,
): Promise<SignupSubmitPayload> {
  const phone = toPhoneIdentity(draft.country, draft.phoneDigits);

  let avatarUrl: string | undefined;
  let nicFrontUrl: string | undefined;
  let nicBackUrl: string | undefined;

  if (draft.profilePhotoUri) {
    const uploaded = await uploadLocalFileToPresignedUrl(draft.profilePhotoUri, {
      purpose: 'avatar',
      signupPhone: phone,
    });
    avatarUrl = uploaded.fileUrl;
  }

  if (draft.nicFrontUri) {
    const uploaded = await uploadLocalFileToPresignedUrl(draft.nicFrontUri, {
      purpose: 'nic_front',
      signupPhone: phone,
    });
    nicFrontUrl = uploaded.fileUrl;
  }

  if (draft.nicBackUri) {
    const uploaded = await uploadLocalFileToPresignedUrl(draft.nicBackUri, {
      purpose: 'nic_back',
      signupPhone: phone,
    });
    nicBackUrl = uploaded.fileUrl;
  }

  const nicNumber = draft.nicNumber.trim();

  return {
    ...phone,
    fullName: draft.fullName.trim(),
    email: draft.email.trim() || undefined,
    address: draft.address.trim() || undefined,
    locationCoordinates: draft.locationCoords,
    mpin: draft.mpin,
    biometricEnabled: draft.biometricEnabled,
    deviceId,
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(nicNumber ? { nicNumber } : {}),
    ...(nicFrontUrl ? { nicFrontUrl } : {}),
    ...(nicBackUrl ? { nicBackUrl } : {}),
  };
}
