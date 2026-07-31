import { Platform, type TextStyle } from 'react-native';

import type { SupportedLanguageCode } from '@/i18n/constants/languages';

export type FontWeightToken = 'regular' | 'medium' | 'semibold' | 'bold';

export const fontFamilies = {
  en: {
    regular: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semibold: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
  },
  ar: {
    regular: 'Cairo-Regular',
    medium: 'Cairo-Medium',
    semibold: 'Cairo-SemiBold',
    bold: 'Cairo-Bold',
  },
} as const satisfies Record<SupportedLanguageCode, Record<FontWeightToken, string>>;

export const appFontAssets = {
  'Outfit-Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
  'Outfit-Medium': require('@/assets/fonts/Outfit-Medium.ttf'),
  'Outfit-SemiBold': require('@/assets/fonts/Outfit-SemiBold.ttf'),
  'Outfit-Bold': require('@/assets/fonts/Outfit-Bold.ttf'),
  'Cairo-Regular': require('@/assets/fonts/Cairo-Regular.ttf'),
  'Cairo-Medium': require('@/assets/fonts/Cairo-Medium.ttf'),
  'Cairo-SemiBold': require('@/assets/fonts/Cairo-SemiBold.ttf'),
  'Cairo-Bold': require('@/assets/fonts/Cairo-Bold.ttf'),
} as const;

export const getFontFamily = (
  language: SupportedLanguageCode,
  weight: FontWeightToken = 'regular',
): string => {
  const languageFonts = fontFamilies[language];
  const selected = languageFonts[weight];

  if (!selected) {
    if (__DEV__) {
      console.warn(`[typography] Missing font weight mapping: ${language}.${weight}`);
    }

    return languageFonts.regular;
  }

  return selected;
};

/** Numeric keyboards should keep Outfit metrics — Cairo skews digit vertical alignment. */
export function isNumericKeyboardType(keyboardType?: string | null): boolean {
  return (
    keyboardType === 'number-pad' ||
    keyboardType === 'phone-pad' ||
    keyboardType === 'decimal-pad' ||
    keyboardType === 'numeric'
  );
}

/**
 * Prefer English (Outfit) for digit fields so Arabic-Indic glyphs don't sit low while typing.
 */
export function getInputFontFamily(
  language: SupportedLanguageCode,
  keyboardType?: string | null,
  weight: FontWeightToken = 'regular',
): string {
  if (isNumericKeyboardType(keyboardType)) {
    return getFontFamily('en', weight);
  }
  return getFontFamily(language, weight);
}

/**
 * Cairo's ascent/descent sits Arabic glyphs high in the line box on iOS.
 * Apply on compact labels (buttons, chips) so text optically centers.
 */
export const iosArabicOpticalAlignStyle: TextStyle | null =
  Platform.OS === 'ios' ? { paddingTop: 4 } : null;

/** Style tokens — pair with AppText `weight` (do not set fontWeight here). */
export const typography = {
  brand: {
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 28,
  } satisfies TextStyle,

  heroTitle: {
    fontSize: 34,
    letterSpacing: -0.6,
    lineHeight: 40,
  } satisfies TextStyle,

  heroSubtitle: {
    fontSize: 16,
    letterSpacing: 0.1,
    lineHeight: 24,
  } satisfies TextStyle,

  button: {
    fontSize: 17,
    letterSpacing: 0.1,
    lineHeight: 22,
  } satisfies TextStyle,

  caption: {
    fontSize: 13,
    letterSpacing: 0.1,
    lineHeight: 18,
  } satisfies TextStyle,

  photoCredit: {
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 14,
  } satisfies TextStyle,
} as const;

export type Typography = typeof typography;
