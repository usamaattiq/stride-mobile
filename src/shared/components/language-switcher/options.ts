import type { TFunction } from 'i18next';

import type { LanguageOption } from './types/language-switcher.types';

export function getLanguageOptions(t: TFunction): readonly LanguageOption[] {
  return [
    { code: 'en', label: t('language.english'), flag: '🇺🇸' },
    { code: 'ar', label: t('language.arabic'), flag: '🇸🇦' },
  ] as const satisfies readonly LanguageOption[];
}
