import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  lastPhoneDigits: 'musafir249.auth.lastPhoneDigits',
  lastCountryCode: 'musafir249.auth.lastCountryCode',
  lastCountryCallingCode: 'musafir249.auth.lastCountryCallingCode',
  biometricEnabled: 'musafir249.security.biometricEnabled',
} as const;

export type LastPhonePreference = {
  phoneDigits: string;
  countryCode: string;
  countryCallingCode: string;
};

export const deviceStorage = {
  async getLastPhone(): Promise<LastPhonePreference | null> {
    const [phoneDigits, countryCode, countryCallingCode] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.lastPhoneDigits),
      AsyncStorage.getItem(STORAGE_KEYS.lastCountryCode),
      AsyncStorage.getItem(STORAGE_KEYS.lastCountryCallingCode),
    ]);

    if (!phoneDigits || !countryCode || !countryCallingCode) {
      return null;
    }

    return { phoneDigits, countryCode, countryCallingCode };
  },

  async setLastPhone(preference: LastPhonePreference): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.lastPhoneDigits, preference.phoneDigits),
      AsyncStorage.setItem(STORAGE_KEYS.lastCountryCode, preference.countryCode),
      AsyncStorage.setItem(STORAGE_KEYS.lastCountryCallingCode, preference.countryCallingCode),
    ]);
  },

  async clearLastPhone(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.lastPhoneDigits),
      AsyncStorage.removeItem(STORAGE_KEYS.lastCountryCode),
      AsyncStorage.removeItem(STORAGE_KEYS.lastCountryCallingCode),
    ]);
  },

  async getBiometricEnabled(): Promise<boolean> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.biometricEnabled)) === 'true';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.biometricEnabled, enabled ? 'true' : 'false');
  },
};
