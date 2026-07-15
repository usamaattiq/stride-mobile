import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';

import { LanguageSwitcherModal } from './LanguageSwitcherModal';
import { LanguageSwitcherTrigger } from './LanguageSwitcherTrigger';
import { getLanguageOptions } from './options';
import type {
  LanguageOption,
  LanguageSwitcherProps,
} from './types/language-switcher.types';

export function LanguageSwitcher({
  variant = 'default',
}: LanguageSwitcherProps): React.ReactElement {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const languageOptions = React.useMemo(() => getLanguageOptions(t), [t]);
  const selectedLanguage = React.useMemo<LanguageOption>(() => {
    const matched = languageOptions.find((option) => option.code === currentLanguage);
    return (
      matched ??
      ({ code: 'en', label: t('language.english'), flag: '🇺🇸' } satisfies LanguageOption)
    );
  }, [currentLanguage, languageOptions, t]);

  const handleSelectLanguage = (language: LanguageOption['code']) => {
    void setLanguage(language);
    setIsModalVisible(false);
  };

  return (
    <>
      <LanguageSwitcherTrigger
        language={selectedLanguage}
        variant={variant}
        onPress={() => setIsModalVisible(true)}
      />
      <LanguageSwitcherModal
        visible={isModalVisible}
        currentLanguage={currentLanguage}
        options={languageOptions}
        onClose={() => setIsModalVisible(false)}
        onSelectLanguage={handleSelectLanguage}
      />
    </>
  );
}
