import { create } from 'zustand';

import type { UserProfileDto } from '@/services/api/authApi.types';

type ProfileStoreState = {
  profile: UserProfileDto | null;
  setProfile: (profile: UserProfileDto) => void;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}));

/** Non-reactive accessors for use outside React. */
export const profileStore = {
  getProfile: (): UserProfileDto | null => useProfileStore.getState().profile,
  setProfile: (profile: UserProfileDto): void => useProfileStore.getState().setProfile(profile),
  clearProfile: (): void => useProfileStore.getState().clearProfile(),
};
