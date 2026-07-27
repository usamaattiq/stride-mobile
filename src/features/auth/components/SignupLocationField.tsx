import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { colors, getFontFamily, radius, spacing } from '@/theme';

import { useKeyboardFocusScroll } from './AuthScaffold';
import { combineLocationLabel, splitLocationLabel } from '../utils/locationLabel';

type SignupLocationFieldProps = {
  label: string;
  value?: string;
  required?: boolean;
  loading?: boolean;
  /** Smaller label + text for tighter forms. */
  dense?: boolean;
  onChangeText: (value: string) => void;
  onUseCurrentLocation: () => void;
  onSelectOnMap: () => void;
};

export function SignupLocationField({
  label,
  value,
  required = false,
  loading = false,
  dense = false,
  onChangeText,
  onUseCurrentLocation,
  onSelectOnMap,
}: SignupLocationFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const handleFocus = useKeyboardFocusScroll();
  const hasValue = Boolean(value?.trim());
  const { addressLine, city, country } = splitLocationLabel(value?.trim() ?? '');
  const cityCountry = [city, country].filter(Boolean).join(', ');

  return (
    <View style={styles.wrap}>
      <AppText
        weight={dense ? 'bold' : 'medium'}
        style={[styles.label, dense && styles.labelDense]}
      >
        {label}
        {required ? (
          <AppText style={[styles.required, dense && styles.requiredDense]}> *</AppText>
        ) : null}
      </AppText>

      {hasValue ? (
        <View style={styles.valueBox}>
          <FontAwesome name="map-marker" size={14} color={colors.primary} style={styles.valueIcon} />
          <View style={styles.valueTextAnchor}>
            <TextInput
              value={addressLine}
              onChangeText={(text) => onChangeText(combineLocationLabel(text, city, country))}
              onFocus={handleFocus}
              placeholder={t('auth.signup.personal.addressLinePlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              style={[
                styles.valueInput,
                dense && styles.valueInputDense,
                { fontFamily: getFontFamily(currentLanguage, 'regular') },
              ]}
            />
            {cityCountry ? (
              <AppText style={[styles.cityCountry, dense && styles.cityCountryDense]} numberOfLines={1}>
                {cityCountry}
              </AppText>
            ) : null}
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
    fontSize: 14,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  requiredDense: {
    fontSize: 14,
  },
  valueBox: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  valueIcon: {
    marginTop: 3,
  },
  valueTextAnchor: {
    flex: 1,
  },
  valueInput: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  valueInputDense: {
    fontSize: 13,
    lineHeight: 18,
  },
  cityCountry: {
    marginTop: 2,
    fontSize: 11,
    color: colors.text.tertiary,
  },
  cityCountryDense: {
    fontSize: 10,
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
    borderRadius: radius.full,
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
