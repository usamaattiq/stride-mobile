import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { toLatinDigits } from '@/shared/utils/latin-digits';
import { FontWeightToken, getFontFamily } from '@/theme/typography';

export type AppTextProps = TextProps & {
  weight?: FontWeightToken;
  style?: StyleProp<TextStyle>;
};

/**
 * Keep Latin digits on Outfit so Cairo's Arabic `locl` digit glyphs don't
 * replace 0–9 (those glyphs sit low / get clipped on iOS). Nested digit
 * spans must inherit size/lineHeight or a trailing 0 (e.g. 650) gets cut.
 */
function renderArabicTextWithLatinDigits(
  text: string,
  weight: FontWeightToken,
  digitStyle: Pick<TextStyle, 'fontSize' | 'lineHeight'>,
): React.ReactNode {
  const latin = toLatinDigits(text);
  const parts = latin.split(/(\d+)/);
  if (parts.length === 1) {
    return latin;
  }

  const digitFont = getFontFamily('en', weight);
  return parts.map((part, index) =>
    /^\d+$/.test(part) ? (
      <Text
        key={`d-${index}`}
        style={[{ fontFamily: digitFont }, digitStyle]}
      >
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
  digitStyle: Pick<TextStyle, 'fontSize' | 'lineHeight'>,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return renderArabicTextWithLatinDigits(child, weight, digitStyle);
    }
    if (typeof child === 'number') {
      return renderArabicTextWithLatinDigits(String(child), weight, digitStyle);
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
  const flatStyle = StyleSheet.flatten(style);
  const content =
    currentLanguage === 'ar'
      ? mapArabicChildren(children, weight, {
          fontSize: flatStyle?.fontSize,
          lineHeight: flatStyle?.lineHeight,
        })
      : children;

  return (
    <Text
      {...rest}
      style={[{ fontFamily: getFontFamily(currentLanguage, weight) }, style]}
    >
      {content}
    </Text>
  );
}
