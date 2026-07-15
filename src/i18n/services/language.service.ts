import * as Localization from 'expo-localization';
import i18n from 'i18next';

import {
  DEFAULT_LANGUAGE,
  type SupportedLanguageCode,
  isRTLLanguage,
  isSupportedLanguageCode,
} from '../constants/languages';
import { cacheService } from './cache.service';

const normalizeDeviceLanguage = (value: string): SupportedLanguageCode => {
  const languageCode = value.toLowerCase();
  const baseLanguage = languageCode.split('-')[0];

  if (isSupportedLanguageCode(languageCode)) {
    return languageCode;
  }

  if (baseLanguage && isSupportedLanguageCode(baseLanguage)) {
    return baseLanguage;
  }

  return DEFAULT_LANGUAGE;
};

export const languageService = {
  getDeviceLanguage(): SupportedLanguageCode {
    const locale = Localization.getLocales()[0];

    if (!locale) {
      return DEFAULT_LANGUAGE;
    }

    return normalizeDeviceLanguage(locale.languageTag ?? locale.languageCode ?? '');
  },

  getCurrentLanguage(): SupportedLanguageCode {
    const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
    return resolvedLanguage
      ? normalizeDeviceLanguage(resolvedLanguage)
      : DEFAULT_LANGUAGE;
  },

  async resolveInitialLanguage(): Promise<SupportedLanguageCode> {
    return (await cacheService.getStoredLanguage()) ?? this.getDeviceLanguage();
  },

  async applyLanguage(language: SupportedLanguageCode): Promise<void> {
    await cacheService.setLanguage(language);

    if (i18n.language !== language) {
      await i18n.changeLanguage(language);
    }
  },

  isRTL(language: SupportedLanguageCode): boolean {
    return isRTLLanguage(language);
  },
};
