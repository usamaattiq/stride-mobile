import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_LANGUAGE,
  type SupportedLanguageCode,
  isSupportedLanguageCode,
} from '../constants/languages';

const STORAGE_KEYS = {
  language: 'APP_LANGUAGE',
} as const;

export const cacheService = {
  async getStoredLanguage(): Promise<SupportedLanguageCode | null> {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.language);
    return language && isSupportedLanguageCode(language) ? language : null;
  },

  async getLanguage(): Promise<SupportedLanguageCode> {
    return (await this.getStoredLanguage()) ?? DEFAULT_LANGUAGE;
  },

  async setLanguage(language: SupportedLanguageCode): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.language, language);
  },
};
