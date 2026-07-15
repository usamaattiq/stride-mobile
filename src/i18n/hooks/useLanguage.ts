import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from '../constants/languages';
import { i18n as appI18n } from '../index';
import { languageService } from '../services/language.service';

export const useLanguage = () => {
  const { i18n } = useTranslation(undefined, { i18n: appI18n });
  const currentLanguage = languageService.getCurrentLanguage();

  const setLanguage = useCallback(async (language: SupportedLanguageCode) => {
    await languageService.applyLanguage(language);
  }, []);

  return {
    currentLanguage,
    isRTL: languageService.isRTL(currentLanguage),
    languages: SUPPORTED_LANGUAGES,
    setLanguage,
    isReady: i18n.isInitialized,
  };
};
