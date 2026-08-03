import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, spacing, typography } from '@/theme';

const BRAND_MARK = require('@/assets/images/splash-logo.png');

type BrandLogoProps = {
  /** Light treatment for dark imagery / primary surfaces. */
  light?: boolean;
  brandName?: string;
};

export function BrandLogo({
  light = false,
  brandName = 'musafir249',
}: BrandLogoProps) {
  const wordmarkColor = light ? colors.text.inverse : colors.text.primary;

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`${brandName} logo`}
      style={styles.row}
    >
      <Image
        source={BRAND_MARK}
        style={styles.mark}
        resizeMode="contain"
        accessibilityElementsHidden
        accessibilityIgnoresInvertColors
      />
      <AppText weight="bold" style={[styles.wordmark, { color: wordmarkColor }]}>
        {brandName}
      </AppText>
    </View>
  );
}

const MARK_SIZE = 42;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: MARK_SIZE,
    borderRadius: 10,
    height: MARK_SIZE,
  },
  wordmark: {
    ...typography.brand,
  },
});
