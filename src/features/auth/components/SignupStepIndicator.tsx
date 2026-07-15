import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';
import { getFontFamily } from '@/theme/typography';

// Step numbers are always Latin digits, so force the Outfit metrics instead of
// the language-driven font (Cairo's ascent/descent sits the glyph noticeably
// higher within its line box on both Android and iOS).
const digitFontFamily = getFontFamily('en', 'bold');

type SignupStepIndicatorProps = {
  /** Total number of steps to render. */
  total: number;
  /** The active step (1-based). */
  current: number;
  /** Render for a dark/brand surface (e.g. the red auth header). */
  onBrand?: boolean;
};

/**
 * Horizontal progress dots for a multi-step flow. Inactive steps are small
 * subtle dots; the active step is an enlarged filled dot showing its number.
 */
export function SignupStepIndicator({
  total,
  current,
  onBrand = false,
}: SignupStepIndicatorProps): React.ReactElement {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {steps.map((step, index) => {
        const isActive = step === current;

        return (
          <React.Fragment key={step}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  onBrand ? styles.connectorOnBrand : styles.connectorDefault,
                ]}
              />
            ) : null}

            {isActive ? (
              <View
                style={[
                  styles.activeDot,
                  onBrand ? styles.activeDotOnBrand : styles.activeDotDefault,
                ]}
              >
                <AppText
                  weight="bold"
                  style={[
                    styles.activeLabel,
                    onBrand ? styles.activeLabelOnBrand : styles.activeLabelDefault,
                    { fontFamily: digitFontFamily },
                  ]}
                >
                  {step}
                </AppText>
              </View>
            ) : (
              <View
                style={[styles.dot, onBrand ? styles.dotOnBrand : styles.dotDefault]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  connectorDefault: {
    backgroundColor: colors.border.default,
  },
  connectorOnBrand: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  dotDefault: {
    backgroundColor: colors.border.strong,
  },
  dotOnBrand: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  activeDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDotDefault: {
    backgroundColor: colors.primary,
  },
  activeDotOnBrand: {
    backgroundColor: colors.white,
  },
  activeLabel: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      default: {},
    }),
  },
  activeLabelDefault: {
    color: colors.white,
  },
  activeLabelOnBrand: {
    color: colors.primary,
  },
});
