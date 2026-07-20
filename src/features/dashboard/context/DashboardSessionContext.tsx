import React from 'react';

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

type DashboardSessionContextValue = {
  user: DashboardSessionUser;
  setRole: (role: AppRole) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  updateProfile: (details: ProfileDetailsUpdate) => void;
  resetSession: () => void;
};

const DEFAULT_USER: DashboardSessionUser = {
  firstName: 'John',
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  address: 'Gulberg III, Lahore',
  mobileNumber: '+92 300 1234567',
  role: 'passenger',
  avatarUri: 'https://i.pravatar.cc/100?img=12',
  credits: 12450,
  notificationCount: 0,
  hasUnreadMessages: false,
  isVerified: true,
  biometricEnabled: false,
};

const DashboardSessionContext = React.createContext<DashboardSessionContextValue | null>(
  null,
);

function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

export function DashboardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = React.useState<DashboardSessionUser>(DEFAULT_USER);

  const setRole = React.useCallback((role: AppRole) => {
    setUser((current) => ({ ...current, role }));
  }, []);

  const setBiometricEnabled = React.useCallback((biometricEnabled: boolean) => {
    setUser((current) => ({ ...current, biometricEnabled }));
  }, []);

  const updateProfile = React.useCallback((details: ProfileDetailsUpdate) => {
    setUser((current) => ({
      ...current,
      fullName: details.fullName.trim(),
      firstName: firstNameFromFullName(details.fullName),
      email: details.email.trim(),
      address: details.address.trim(),
      avatarUri: details.avatarUri !== undefined ? details.avatarUri : current.avatarUri,
    }));
  }, []);

  const resetSession = React.useCallback(() => {
    setUser(DEFAULT_USER);
  }, []);

  const value = React.useMemo(
    () => ({ user, setRole, setBiometricEnabled, updateProfile, resetSession }),
    [user, setRole, setBiometricEnabled, updateProfile, resetSession],
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
