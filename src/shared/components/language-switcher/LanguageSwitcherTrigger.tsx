import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { LanguageSwitcherTriggerProps } from './types/language-switcher.types';

const isAndroid = Platform.OS === 'android';
const isIos = Platform.OS === 'ios';

const androidTextStyle = isAndroid
  ? ({
      includeFontPadding: false,
      textAlignVertical: 'center' as const,
    } satisfies object)
  : null;

// Compact chip needs a stronger nudge than shared button optical align.
const iosArabicLabelStyle = {
  paddingTop: 7,
} as const;

const glassRipple = isAndroid
  ? ({ color: 'rgba(255,255,255,0.2)', borderless: false, foreground: true } satisfies object)
  : undefined;

const defaultRipple = isAndroid
  ? ({ color: 'rgba(10, 22, 64, 0.06)', borderless: false, foreground: true } satisfies object)
  : undefined;

export function LanguageSwitcherTrigger({
  language,
  onPress,
  variant,
}: LanguageSwitcherTriggerProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const isGlass = variant === 'glass';
  const iosArabicAlign = isIos && currentLanguage === 'ar' ? iosArabicLabelStyle : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Language: ${language.label}`}
      testID="language-switcher-trigger"
      style={isGlass ? styles.glassTrigger : styles.trigger}
      android_ripple={isGlass ? glassRipple : defaultRipple}
    >
      <View style={styles.flagWrap}>
        <AppText style={[isGlass ? styles.glassFlag : styles.flag, androidTextStyle]}>
          {language.flag}
        </AppText>
      </View>
      <AppText
        weight="medium"
        style={[
          isGlass ? styles.glassLabel : styles.label,
          androidTextStyle,
          iosArabicAlign,
        ]}
        numberOfLines={1}
      >
        {language.label}
      </AppText>
      <FontAwesome
        name="chevron-down"
        size={12}
        color={isGlass ? 'rgba(255,255,255,0.92)' : colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 150,
    overflow: 'hidden',
  },
  glassTrigger: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0B1E56',
        shadowOpacity: 0.28,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 14,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  flagWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 14,
  },
  glassFlag: {
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  glassLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
