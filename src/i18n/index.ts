import i18n, { type InitOptions, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, type SupportedLanguageCode } from './constants/languages';
import { languageService } from './services/language.service';

export const I18N_NAMESPACE = 'translation';
export const I18N_FALLBACK_CHAIN = [DEFAULT_LANGUAGE] as const;

let initializationPromise: Promise<typeof i18n> | null = null;

function loadBundles(): Record<SupportedLanguageCode, object> {
  return {
    en: require('./locales/en.json'),
    ar: require('./locales/ar.json'),
  };
}

const buildResources = (): Resource => {
  const bundles = loadBundles();
  return {
    en: { [I18N_NAMESPACE]: bundles.en },
    ar: { [I18N_NAMESPACE]: bundles.ar },
  };
};

export const initializeI18n = async (): Promise<typeof i18n> => {
  if (i18n.isInitialized) {
    return i18n;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const initialLanguage = await languageService.resolveInitialLanguage();

    const initOptions: InitOptions = {
      lng: initialLanguage,
      fallbackLng: [...I18N_FALLBACK_CHAIN],
      defaultNS: I18N_NAMESPACE,
      ns: [I18N_NAMESPACE],
      resources: buildResources(),
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      missingKeyHandler: (_lng, _ns, key) => {
        if (__DEV__) {
          console.warn(`[i18n] Missing translation key: ${key}`);
        }
      },
      saveMissing: __DEV__,
    };

    await i18n.use(initReactI18next).init(initOptions);
    await languageService.applyLanguage(initialLanguage);

    return i18n;
  })();

  return initializationPromise;
};

export { i18n };
