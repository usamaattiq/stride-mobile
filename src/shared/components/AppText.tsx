import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { toLatinDigits } from '@/shared/utils/latin-digits';
import { FontWeightToken, getFontFamily } from '@/theme/typography';

export type AppTextProps = TextProps & {
  weight?: FontWeightToken;
  style?: StyleProp<TextStyle>;
};

/**
 * Keep Latin digits on Outfit so Cairo's Arabic `locl` digit glyphs don't
 * replace 0–9 (those glyphs sit low / get clipped on iOS).
 */
function renderArabicTextWithLatinDigits(
  text: string,
  weight: FontWeightToken,
): React.ReactNode {
  const latin = toLatinDigits(text);
  const parts = latin.split(/(\d+)/);
  if (parts.length === 1) {
    return latin;
  }

  const digitFont = getFontFamily('en', weight);
  return parts.map((part, index) =>
    /^\d+$/.test(part) ? (
      <Text key={`d-${index}`} style={{ fontFamily: digitFont }}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}

function mapArabicChildren(
  children: React.ReactNode,
  weight: FontWeightToken,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return renderArabicTextWithLatinDigits(child, weight);
    }
    if (typeof child === 'number') {
      return renderArabicTextWithLatinDigits(String(child), weight);
    }
    return child;
  });
}

export function AppText({
  weight = 'regular',
  style,
  children,
  ...rest
}: AppTextProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const content =
    currentLanguage === 'ar' ? mapArabicChildren(children, weight) : children;

  return (
    <Text
      {...rest}
      style={[{ fontFamily: getFontFamily(currentLanguage, weight) }, style]}
    >
      {content}
    </Text>
  );
}
