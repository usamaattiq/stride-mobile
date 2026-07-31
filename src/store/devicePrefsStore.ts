import { create } from 'zustand';

import { deviceStorage, type LastPhonePreference } from '@/services/storage/deviceStorage';
import { secureStorage } from '@/services/storage/secureStorage';

type DevicePrefsState = {
  hydrated: boolean;
  lastPhone: LastPhonePreference | null;
  cachedMpin: string | null;
  biometricEnabled: boolean;
  hydrate: () => Promise<void>;
  setLastPhone: (preference: LastPhonePreference) => Promise<void>;
  clearLastPhone: () => Promise<void>;
  setCachedMpin: (mpin: string) => Promise<void>;
  clearCachedMpin: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
};

export const useDevicePrefsStore = create<DevicePrefsState>((set, get) => ({
  hydrated: false,
  lastPhone: null,
  cachedMpin: null,
  biometricEnabled: false,

  hydrate: async () => {
    const [lastPhone, cachedMpin, biometricEnabled] = await Promise.all([
      deviceStorage.getLastPhone(),
      secureStorage.getCachedMpin(),
      deviceStorage.getBiometricEnabled(),
    ]);
    set({ lastPhone, cachedMpin, biometricEnabled, hydrated: true });
  },

  setLastPhone: async (preference) => {
    await deviceStorage.setLastPhone(preference);
    set({ lastPhone: preference });
  },

  clearLastPhone: async () => {
    await deviceStorage.clearLastPhone();
    set({ lastPhone: null });
  },

  setCachedMpin: async (mpin) => {
    await secureStorage.setCachedMpin(mpin);
    set({ cachedMpin: mpin });
  },

  clearCachedMpin: async () => {
    await secureStorage.clearCachedMpin();
    set({ cachedMpin: null });
  },

  setBiometricEnabled: async (enabled) => {
    await deviceStorage.setBiometricEnabled(enabled);
    // Keep any cached MPIN when toggling off — Face ID login only uses it while
    // biometricEnabled is true, and clearing it here broke the first login after
    // re-enabling Face ID from Settings (flag on, credential missing).
    set({ biometricEnabled: enabled });
  },
}));

/** Non-reactive accessors for use outside React. */
export const devicePrefsStore = {
  getState: (): DevicePrefsState => useDevicePrefsStore.getState(),
  hydrate: (): Promise<void> => useDevicePrefsStore.getState().hydrate(),
  clearLastPhone: (): Promise<void> => useDevicePrefsStore.getState().clearLastPhone(),
  clearCachedMpin: (): Promise<void> => useDevicePrefsStore.getState().clearCachedMpin(),
};
