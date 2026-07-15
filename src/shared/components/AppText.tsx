import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { FontWeightToken, getFontFamily } from '@/theme/typography';

export type AppTextProps = TextProps & {
  weight?: FontWeightToken;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  weight = 'regular',
  style,
  children,
  ...rest
}: AppTextProps): React.ReactElement {
  const { currentLanguage } = useLanguage();

  return (
    <Text
      {...rest}
      style={[{ fontFamily: getFontFamily(currentLanguage, weight) }, style]}
    >
      {children}
    </Text>
  );
}
