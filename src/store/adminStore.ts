import { create } from 'zustand';

import type { AdminProfile } from '@/services/api/adminApi';

type AdminStoreState = {
  profile: AdminProfile | null;
  setProfile: (profile: AdminProfile) => void;
  clearProfile: () => void;
};

export const useAdminStore = create<AdminStoreState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}));

export const adminStore = {
  setProfile: (profile: AdminProfile): void => useAdminStore.getState().setProfile(profile),
  clearProfile: (): void => useAdminStore.getState().clearProfile(),
};
