import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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
  subtitle?: string;
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
  subtitle,
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
            <FontAwesome
              name="chevron-left"
              size={12}
              color={onImage ? colors.text.inverse : colors.text.primary}
            />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <View style={styles.titleBlock}>
          <AppText
            weight="bold"
            numberOfLines={1}
            style={[styles.title, onImage && styles.titleOnImage]}
          >
            {title}
          </AppText>
       
        </View>
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
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  title: {
    ...typography.button,
    textAlign: 'center',
    color: colors.text.primary,
  },
  titleOnImage: {
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  subtitleOnImage: {
    color: colors.text.inverseMuted,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
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
  pressed: {
    opacity: 0.75,
  },
});
