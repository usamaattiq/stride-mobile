import { create } from 'zustand';

import { secureStorage, type SessionKind } from '@/services/storage/secureStorage';

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

type AuthStoreState = {
  status: AuthStatus;
  accessToken: string | null;
  sessionKind: SessionKind | null;
  setAuthenticated: (token: string, sessionKind?: SessionKind) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<{ token: string | null; sessionKind: SessionKind | null }>;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'idle',
  accessToken: null,
  sessionKind: null,

  setAuthenticated: async (token, sessionKind = 'user') => {
    await Promise.all([
      secureStorage.setAccessToken(token),
      secureStorage.setSessionKind(sessionKind),
    ]);
    set({ status: 'authenticated', accessToken: token, sessionKind });
  },

  signOut: async () => {
    await Promise.all([
      secureStorage.clearAccessToken(),
      secureStorage.clearSessionKind(),
    ]);
    set({ status: 'unauthenticated', accessToken: null, sessionKind: null });
  },

  hydrate: async () => {
    const [token, sessionKind] = await Promise.all([
      secureStorage.getAccessToken(),
      secureStorage.getSessionKind(),
    ]);
    set({
      accessToken: token,
      sessionKind: token ? sessionKind ?? 'user' : null,
      status: token ? 'authenticated' : 'unauthenticated',
    });
    return { token, sessionKind: token ? sessionKind ?? 'user' : null };
  },
}));

/** Non-reactive accessors for use outside React (axios interceptors, handlers). */
export const authStore = {
  getToken: (): string | null => useAuthStore.getState().accessToken,
  getSessionKind: (): SessionKind | null => useAuthStore.getState().sessionKind,
  getStatus: (): AuthStatus => useAuthStore.getState().status,
  setAuthenticated: (token: string, sessionKind?: SessionKind): Promise<void> =>
    useAuthStore.getState().setAuthenticated(token, sessionKind),
  signOut: (): Promise<void> => useAuthStore.getState().signOut(),
  hydrate: (): Promise<{ token: string | null; sessionKind: SessionKind | null }> =>
    useAuthStore.getState().hydrate(),
};
