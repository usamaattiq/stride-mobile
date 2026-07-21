import { create } from 'zustand';

import type { CountryOption } from '@/features/auth/constants/countries';
import { DEFAULT_COUNTRY } from '@/features/auth/constants/countries';

type LoginFlowState = {
  country: CountryOption;
  phoneDigits: string;
  otp: string;
  mpin: string;
  forgotOtp: string;
  newMpin: string;
  newMpinConfirm: string;
  setCountry: (country: CountryOption) => void;
  setPhoneDigits: (digits: string) => void;
  setOtp: (otp: string) => void;
  setMpin: (mpin: string) => void;
  setForgotOtp: (otp: string) => void;
  setNewMpin: (mpin: string) => void;
  setNewMpinConfirm: (mpin: string) => void;
  reset: () => void;
};

/** Transient, in-memory only — carries phone/OTP/MPIN across LoginFlowScreen's steps. */
export const useLoginFlowStore = create<LoginFlowState>((set) => ({
  country: DEFAULT_COUNTRY,
  phoneDigits: '',
  otp: '',
  mpin: '',
  forgotOtp: '',
  newMpin: '',
  newMpinConfirm: '',
  setCountry: (country) => set({ country }),
  setPhoneDigits: (phoneDigits) => set({ phoneDigits }),
  setOtp: (otp) => set({ otp }),
  setMpin: (mpin) => set({ mpin }),
  setForgotOtp: (forgotOtp) => set({ forgotOtp }),
  setNewMpin: (newMpin) => set({ newMpin }),
  setNewMpinConfirm: (newMpinConfirm) => set({ newMpinConfirm }),
  reset: () =>
    set({
      country: DEFAULT_COUNTRY,
      phoneDigits: '',
      otp: '',
      mpin: '',
      forgotOtp: '',
      newMpin: '',
      newMpinConfirm: '',
    }),
}));
