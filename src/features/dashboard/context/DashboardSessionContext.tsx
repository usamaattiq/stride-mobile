import React from 'react';

import { authApi } from '@/services/api/authApi';
import type { AuthLoginResult, UserProfileDto } from '@/services/api/authApi.types';
import { getDeviceId } from '@/services/deviceId';
import { useAuthStore } from '@/store/authStore';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';
import { useProfileStore } from '@/store/profileStore';

export type AppRole = 'passenger' | 'driver';

export type DashboardSessionUser = {
  firstName: string;
  fullName: string;
  email: string;
  address: string;
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
  avatarUri?: string;
};

export type BecomeDriverInput = {
  licenseNumber: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
};

type DashboardSessionContextValue = {
  user: DashboardSessionUser;
  /** True once license verification has been completed (can switch driver ↔ passenger). */
  hasDriverVerification: boolean;
  /** Local-only override (DEV shortcuts). Prefer becomeDriver / switchToPassenger. */
  setRole: (role: AppRole) => void;
  becomeDriver: (input: BecomeDriverInput) => Promise<void>;
  switchToDriver: () => Promise<void>;
  switchToPassenger: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  updateProfile: (details: ProfileDetailsUpdate) => void;
  resetSession: () => void;
};

const FALLBACK_USER: DashboardSessionUser = {
  firstName: '',
  fullName: '',
  email: '',
  address: '',
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
    mobileNumber: profile.phoneE164,
    role: profile.role,
    avatarUri: profile.avatarUrl ?? undefined,
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

  const setBiometricEnabled = React.useCallback(
    async (biometricEnabled: boolean) => {
      const updated = await authApi.updateMe({ biometricEnabled });
      setProfile(updated);
      await useDevicePrefsStore.getState().setBiometricEnabled(biometricEnabled);
    },
    [setProfile],
  );

  const updateProfile = React.useCallback((details: ProfileDetailsUpdate) => {
    setLocalOverrides((current) => ({
      ...current,
      fullName: details.fullName.trim(),
      firstName: firstNameFromFullName(details.fullName),
      email: details.email.trim(),
      address: details.address.trim(),
      avatarUri: details.avatarUri !== undefined ? details.avatarUri : current.avatarUri,
    }));
  }, []);

  const resetSession = React.useCallback(() => {
    setLocalOverrides({});
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      hasDriverVerification,
      setRole,
      becomeDriver,
      switchToDriver,
      switchToPassenger,
      setBiometricEnabled,
      updateProfile,
      resetSession,
    }),
    [
      user,
      hasDriverVerification,
      setRole,
      becomeDriver,
      switchToDriver,
      switchToPassenger,
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
