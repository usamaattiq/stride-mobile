import React from 'react';

export type AppRole = 'passenger' | 'driver';

export type DashboardSessionUser = {
  firstName: string;
  fullName: string;
  role: AppRole;
  avatarUri?: string;
  credits: number;
  notificationCount: number;
  hasUnreadMessages: boolean;
  isVerified: boolean;
};

type DashboardSessionContextValue = {
  user: DashboardSessionUser;
  setRole: (role: AppRole) => void;
  resetSession: () => void;
};

const DEFAULT_USER: DashboardSessionUser = {
  firstName: 'Masud',
  fullName: 'Masud Khan',
  role: 'passenger',
  avatarUri: 'https://i.pravatar.cc/100?img=12',
  credits: 12450,
  notificationCount: 0,
  hasUnreadMessages: false,
  isVerified: true,
};

const DashboardSessionContext = React.createContext<DashboardSessionContextValue | null>(
  null,
);

export function DashboardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = React.useState<DashboardSessionUser>(DEFAULT_USER);

  const setRole = React.useCallback((role: AppRole) => {
    setUser((current) => ({ ...current, role }));
  }, []);

  const resetSession = React.useCallback(() => {
    setUser(DEFAULT_USER);
  }, []);

  const value = React.useMemo(
    () => ({ user, setRole, resetSession }),
    [user, setRole, resetSession],
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
