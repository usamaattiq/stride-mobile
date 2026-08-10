import React from 'react';

import { authApi } from '@/services/api/authApi';
import type { AuthLoginResult, UserProfileDto } from '@/services/api/authApi.types';
import { getDeviceId } from '@/services/deviceId';
import {
  isRemoteMediaUrl,
  uploadLocalFileToPresignedUrl,
} from '@/shared/services/mediaUploadService';
import { useAuthStore } from '@/store/authStore';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';
import { useProfileStore } from '@/store/profileStore';

export type AppRole = 'passenger' | 'driver';

export type DashboardSessionUser = {
  firstName: string;
  fullName: string;
  email: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  /** Display-only phone (not editable in General Information). */
  mobileNumber: string;
  role: AppRole;
  avatarUri?: string;
  credits: number;
  notificationCount: number;
  hasUnreadMessages: boolean;
  isVerified: boolean;
  biometricEnabled: boolean;
};

export type ProfileDetailsUpdate = {
  fullName: string;
  email: string;
  address: string;
  /** Pass `null` to clear avatar; omit to leave unchanged. */
  avatarUri?: string | null;
  locationCoordinates?: { latitude: number; longitude: number } | null;
};

export type BecomeDriverInput = {
  licenseNumber: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
};

export type NicVerificationInput = {
  nicNumber: string;
  nicFrontUrl: string;
  nicBackUrl: string;
};

export type LicenseVerificationInput = BecomeDriverInput;

type DashboardSessionContextValue = {
  user: DashboardSessionUser;
  /** True once license verification has been completed (can switch driver ↔ passenger). */
  hasDriverVerification: boolean;
  /** Local-only override (DEV shortcuts). Prefer becomeDriver / switchToPassenger. */
  setRole: (role: AppRole) => void;
  setHasUnreadMessages: (hasUnread: boolean) => void;
  becomeDriver: (input: BecomeDriverInput) => Promise<void>;
  switchToDriver: () => Promise<void>;
  switchToPassenger: () => Promise<void>;
  submitNicVerification: (input: NicVerificationInput) => Promise<void>;
  submitLicenseVerification: (input: LicenseVerificationInput) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  updateProfile: (details: ProfileDetailsUpdate) => Promise<void>;
  resetSession: () => void;
};

const FALLBACK_USER: DashboardSessionUser = {
  firstName: '',
  fullName: '',
  email: '',
  address: '',
  latitude: null,
  longitude: null,
  mobileNumber: '',
  role: 'passenger',
  avatarUri: undefined,
  credits: 0,
  notificationCount: 0,
  hasUnreadMessages: false,
  isVerified: false,
  biometricEnabled: false,
};

function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

function toDashboardSessionUser(profile: UserProfileDto | null): DashboardSessionUser {
  if (!profile) {
    return FALLBACK_USER;
  }
  return {
    firstName: firstNameFromFullName(profile.fullName),
    fullName: profile.fullName,
    email: profile.email ?? '',
    address: profile.address ?? '',
    latitude: profile.latitude,
    longitude: profile.longitude,
    mobileNumber: profile.phoneE164,
    role: profile.role,
    avatarUri: profile.avatarViewUrl ?? profile.avatarUrl ?? undefined,
    credits: profile.credits,
    notificationCount: 0,
    hasUnreadMessages: false,
    isVerified: profile.isVerified,
    biometricEnabled: profile.biometricEnabled,
  };
}

const DashboardSessionContext = React.createContext<DashboardSessionContextValue | null>(
  null,
);

export function DashboardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  // In-progress profile edits from General Information — layered on the server profile.
  // Role comes from the server after becomeDriver / switchToPassenger.
  const [localOverrides, setLocalOverrides] = React.useState<Partial<DashboardSessionUser>>({});

  React.useEffect(() => {
    setLocalOverrides({});
  }, [profile?.id]);

  const user = React.useMemo<DashboardSessionUser>(
    () => ({ ...toDashboardSessionUser(profile), ...localOverrides }),
    [profile, localOverrides],
  );

  const hasDriverVerification = React.useMemo(
    () =>
      Boolean(
        profile?.driverLicenseNumber?.trim() &&
          profile.driverLicenseFrontUrl &&
          profile.driverLicenseBackUrl,
      ),
    [profile],
  );

  const applyAuthResult = React.useCallback(
    async (result: AuthLoginResult) => {
      await useAuthStore.getState().setAuthenticated(result.accessToken);
      setProfile(result.profile);
      setLocalOverrides({});
    },
    [setProfile],
  );

  const setRole = React.useCallback((role: AppRole) => {
    setLocalOverrides((current) => ({ ...current, role }));
  }, []);

  const setHasUnreadMessages = React.useCallback((hasUnreadMessages: boolean) => {
    setLocalOverrides((current) =>
      current.hasUnreadMessages === hasUnreadMessages
        ? current
        : { ...current, hasUnreadMessages },
    );
  }, []);

  const becomeDriver = React.useCallback(
    async (input: BecomeDriverInput) => {
      const deviceId = await getDeviceId();
      const result = await authApi.becomeDriver({
        licenseNumber: input.licenseNumber.trim(),
        licenseFrontUrl: input.licenseFrontUrl,
        licenseBackUrl: input.licenseBackUrl,
        deviceId,
      });
      await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const switchToDriver = React.useCallback(async () => {
    const deviceId = await getDeviceId();
    const result = await authApi.switchToDriver(deviceId);
    await applyAuthResult(result);
  }, [applyAuthResult]);

  const switchToPassenger = React.useCallback(async () => {
    const deviceId = await getDeviceId();
    const result = await authApi.switchToPassenger(deviceId);
    await applyAuthResult(result);
  }, [applyAuthResult]);

  const submitNicVerification = React.useCallback(
    async (input: NicVerificationInput) => {
      const updated = await authApi.updateMe({
        nicNumber: input.nicNumber.trim(),
        nicFrontUrl: input.nicFrontUrl,
        nicBackUrl: input.nicBackUrl,
      });
      setProfile(updated);
    },
    [setProfile],
  );

  const submitLicenseVerification = React.useCallback(
    async (input: LicenseVerificationInput) => {
      const updated = await authApi.updateMe({
        driverLicenseNumber: input.licenseNumber.trim(),
        driverLicenseFrontUrl: input.licenseFrontUrl,
        driverLicenseBackUrl: input.licenseBackUrl,
      });
      setProfile(updated);
    },
    [setProfile],
  );

  const setBiometricEnabled = React.useCallback(
    async (biometricEnabled: boolean) => {
      const updated = await authApi.updateMe({ biometricEnabled });
      setProfile(updated);
      await useDevicePrefsStore.getState().setBiometricEnabled(biometricEnabled);
    },
    [setProfile],
  );

  const updateProfile = React.useCallback(
    async (details: ProfileDetailsUpdate) => {
      let avatarUrl: string | null | undefined;

      if (details.avatarUri !== undefined) {
        if (details.avatarUri === null || details.avatarUri === '') {
          avatarUrl = null;
        } else if (isRemoteMediaUrl(details.avatarUri)) {
          // Prefer stable fileUrl from server profile when the UI is showing a signed view URL.
          avatarUrl = profile?.avatarUrl ?? details.avatarUri;
        } else {
          const uploaded = await uploadLocalFileToPresignedUrl(details.avatarUri, {
            purpose: 'avatar',
          });
          avatarUrl = uploaded.fileUrl;
        }
      }

      const updated = await authApi.updateMe({
        fullName: details.fullName.trim(),
        email: details.email.trim() || null,
        address: details.address.trim() || null,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(details.locationCoordinates !== undefined
          ? { locationCoordinates: details.locationCoordinates }
          : {}),
      });
      setProfile(updated);
      setLocalOverrides({});
    },
    [profile?.avatarUrl, setProfile],
  );

  const resetSession = React.useCallback(() => {
    setLocalOverrides({});
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      hasDriverVerification,
      setRole,
      setHasUnreadMessages,
      becomeDriver,
      switchToDriver,
      switchToPassenger,
      submitNicVerification,
      submitLicenseVerification,
      setBiometricEnabled,
      updateProfile,
      resetSession,
    }),
    [
      user,
      hasDriverVerification,
      setRole,
      setHasUnreadMessages,
      becomeDriver,
      switchToDriver,
      switchToPassenger,
      submitNicVerification,
      submitLicenseVerification,
      setBiometricEnabled,
      updateProfile,
      resetSession,
    ],
  );

  return (
    <DashboardSessionContext.Provider value={value}>
      {children}
    </DashboardSessionContext.Provider>
  );
}

export function useDashboardSession(): DashboardSessionContextValue {
  const context = React.useContext(DashboardSessionContext);
  if (!context) {
    throw new Error('useDashboardSession must be used within DashboardSessionProvider');
  }
  return context;
}
