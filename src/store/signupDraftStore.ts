import { create } from 'zustand';

import { createEmptySignupDraft, type SignupDraft } from '@/features/auth/types/signup.types';

type SignupDraftState = {
  draft: SignupDraft;
  patchDraft: (partial: Partial<SignupDraft>) => void;
  resetDraft: () => void;
};

/** 1:1 replacement for the old SignupDraftContext — signup wizard's in-memory draft. */
export const useSignupDraftStore = create<SignupDraftState>((set) => ({
  draft: createEmptySignupDraft(),
  patchDraft: (partial) => set((state) => ({ draft: { ...state.draft, ...partial } })),
  resetDraft: () => set({ draft: createEmptySignupDraft() }),
}));
