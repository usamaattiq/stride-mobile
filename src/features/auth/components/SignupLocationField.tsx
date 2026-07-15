import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type SignupLocationFieldProps = {
  label: string;
  value?: string;
  required?: boolean;
  loading?: boolean;
  /** Smaller label + text for tighter forms. */
  dense?: boolean;
  onUseCurrentLocation: () => void;
  onSelectOnMap: () => void;
};

export function SignupLocationField({
  label,
  value,
  required = false,
  loading = false,
  dense = false,
  onUseCurrentLocation,
  onSelectOnMap,
}: SignupLocationFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const hasValue = Boolean(value?.trim());

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={[styles.label, dense && styles.labelDense]}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      {hasValue ? (
        <View style={styles.valueBox}>
          <FontAwesome name="map-marker" size={14} color={colors.primary} />
          <View style={styles.valueTextAnchor}>
            <AppText style={[styles.valueText, dense && styles.valueTextDense]} numberOfLines={2}>
              {value!.trim()}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText style={[styles.placeholder, dense && styles.placeholderDense]}>
          {t('auth.signup.personal.locationPlaceholder')}
        </AppText>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={onUseCurrentLocation}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <FontAwesome name="location-arrow" size={13} color={colors.primary} />
          )}
          <AppText weight="medium" style={styles.actionText} numberOfLines={1}>
            {t('auth.signup.personal.useCurrentLocation')}
          </AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={onSelectOnMap}
          accessibilityRole="button"
        >
          <FontAwesome name="map-o" size={13} color={colors.primary} />
          <AppText weight="medium" style={styles.actionText} numberOfLines={1}>
            {t('auth.signup.personal.selectOnMap')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  labelDense: {
    fontSize: 12,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  valueBox: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  valueTextAnchor: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    paddingVertical: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  valueTextDense: {
    fontSize: 13,
    lineHeight: 18,
  },
  placeholder: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  placeholderDense: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryDisabled,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonPressed: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
  },
});
