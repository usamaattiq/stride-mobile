import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { LanguageSwitcher } from '@/shared/components/language-switcher';
import { colors, spacing, typography } from '@/theme';

import { BrandLogo } from './BrandLogo';

export type AppTopBarProps = {
  /**
   * `onImage` — glass language control for hero imagery.
   * `default` — light language chip for default surfaces.
   */
  variant?: 'default' | 'onImage';
  /** Left side content mode. */
  left?: 'logo' | 'back' | 'none';
  title?: string;
  brandName?: string;
  onBackPress?: () => void;
  showLanguageSwitcher?: boolean;
  /** Optional extra actions on the right (after language switcher). */
  rightSlot?: ReactNode;
  /** Skip top safe-area padding when parent already applies it. */
  includeSafeArea?: boolean;
  style?: ViewStyle;
};

export function AppTopBar({
  variant = 'default',
  left = 'none',
  title,
  brandName,
  onBackPress,
  showLanguageSwitcher = false,
  rightSlot,
  includeSafeArea = true,
  style,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();
  const onImage = variant === 'onImage';

  return (
    <View
      style={[
        styles.container,
        includeSafeArea && { paddingTop: insets.top + spacing.sm },
        style,
      ]}
    >
      <View style={styles.side}>
        {left === 'logo' ? (
          <BrandLogo light={onImage} brandName={brandName} />
        ) : null}

        {left === 'back' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              onImage ? styles.backButtonOnImage : styles.backButtonDefault,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={[styles.backIcon, onImage && styles.backIconOnImage]}>
              ←
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <AppText
          weight="bold"
          numberOfLines={1}
          style={[styles.title, onImage && styles.titleOnImage]}
        >
          {title}
        </AppText>
      ) : (
        <View style={styles.titleSpacer} />
      )}

      <View style={[styles.side, styles.sideRight]}>
        {showLanguageSwitcher ? (
          <LanguageSwitcher variant={onImage ? 'glass' : 'default'} />
        ) : null}
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  side: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  titleSpacer: {
    flex: 1,
  },
  title: {
    ...typography.button,
    flex: 1,
    textAlign: 'center',
    color: colors.text.primary,
  },
  titleOnImage: {
    color: colors.text.inverse,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDefault: {
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  backButtonOnImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  backIcon: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: -1,
  },
  backIconOnImage: {
    color: colors.text.inverse,
  },
  pressed: {
    opacity: 0.75,
  },
});
