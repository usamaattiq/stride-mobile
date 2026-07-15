import type { SupportedLanguageCode } from '@/i18n/constants/languages';

export type LanguageOption = {
  code: SupportedLanguageCode;
  label: string;
  flag: string;
};

export type LanguageSwitcherVariant = 'default' | 'glass';

export type LanguageSwitcherProps = {
  variant?: LanguageSwitcherVariant;
};

export type LanguageSwitcherTriggerProps = {
  language: LanguageOption;
  onPress: () => void;
  variant: LanguageSwitcherVariant;
};

export type LanguageSwitcherModalProps = {
  visible: boolean;
  currentLanguage: SupportedLanguageCode;
  onClose: () => void;
  onSelectLanguage: (language: SupportedLanguageCode) => void;
  options: readonly LanguageOption[];
};
