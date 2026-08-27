import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { CreditCostBadge } from '@/shared/components/CreditCostBadge';
import { colors, iosArabicOpticalAlignStyle, radius, spacing, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
  /** Fire on press-in so Continue isn't lost when an input blurs (Android). */
  eagerPress?: boolean;
  creditCost?: number;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
  eagerPress = false,
  creditCost,
}: ButtonProps) {
  const { currentLanguage } = useLanguage();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const iosArabicAlign =
    Platform.OS === 'ios' && currentLanguage === 'ar' ? iosArabicOpticalAlignStyle : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        creditCost != null ? `${label}, ${creditCost}` : label
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={eagerPress ? undefined : onPress}
      onPressIn={eagerPress && !isDisabled ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.text.inverse : colors.primary} />
      ) : (
        <View style={styles.content}>
          <AppText
            weight="bold"
            style={[
              styles.label,
              isPrimary ? styles.primaryLabel : styles.secondaryLabel,
              isDisabled && styles.disabledLabel,
              iosArabicAlign,
            ]}
          >
            {label}
          </AppText>
          {creditCost != null ? <CreditCostBadge count={creditCost} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: colors.primaryMuted,
  },
  disabled: {
    backgroundColor: colors.primaryDisabled,
    opacity: 1,
    borderColor: colors.primaryDisabled,
  },
  label: {
    ...typography.button,
    textAlign: 'center',
  } satisfies TextStyle,
  primaryLabel: {
    color: colors.text.inverse,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  disabledLabel: {
    color: colors.white,
  },
});
