import { create } from 'zustand';

import { secureStorage } from '@/services/storage/secureStorage';

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

type AuthStoreState = {
  status: AuthStatus;
  accessToken: string | null;
  setAuthenticated: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<string | null>;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'idle',
  accessToken: null,

  setAuthenticated: async (token) => {
    await secureStorage.setAccessToken(token);
    set({ status: 'authenticated', accessToken: token });
  },

  signOut: async () => {
    await secureStorage.clearAccessToken();
    set({ status: 'unauthenticated', accessToken: null });
  },

  hydrate: async () => {
    const token = await secureStorage.getAccessToken();
    set({ accessToken: token, status: token ? 'authenticated' : 'unauthenticated' });
    return token;
  },
}));

/** Non-reactive accessors for use outside React (axios interceptors, handlers). */
export const authStore = {
  getToken: (): string | null => useAuthStore.getState().accessToken,
  getStatus: (): AuthStatus => useAuthStore.getState().status,
  setAuthenticated: (token: string): Promise<void> => useAuthStore.getState().setAuthenticated(token),
  signOut: (): Promise<void> => useAuthStore.getState().signOut(),
  hydrate: (): Promise<string | null> => useAuthStore.getState().hydrate(),
};
