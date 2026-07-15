import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing, typography } from '@/theme';

type BrandLogoProps = {
  /** Light treatment for dark imagery / primary surfaces. */
  light?: boolean;
  brandName?: string;
};

export function BrandLogo({
  light = false,
  brandName = 'transit',
}: BrandLogoProps) {
  const wordmarkColor = light ? colors.text.inverse : colors.text.primary;

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`${brandName} logo`}
      style={styles.row}
    >
      <View style={styles.mark} accessibilityElementsHidden>
        <View style={styles.markRoof} />
        <View style={styles.markBody}>
          <View style={styles.markWindow} />
          <View style={styles.markWindow} />
        </View>
        <View style={styles.markBumper} />
      </View>
      <AppText weight="bold" style={[styles.wordmark, { color: wordmarkColor }]}>
        {brandName}
      </AppText>
    </View>
  );
}

const MARK_SIZE = 36;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  markRoof: {
    width: 18,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.white,
    marginBottom: 2,
  },
  markBody: {
    width: 22,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  markWindow: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  markBumper: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.white,
    marginTop: 2,
    opacity: 0.85,
  },
  wordmark: {
    ...typography.brand,
  },
});
