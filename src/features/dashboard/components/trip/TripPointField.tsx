import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TripLocationPoint } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { useResolvedLocationPointLabel } from '@/shared/hooks/useResolvedLocationPointLabel';
import { colors, radius, spacing } from '@/theme';

type TripPointFieldProps = {
  label: string;
  value: TripLocationPoint | null;
  onSelectOnMap: () => void;
  required?: boolean;
  optional?: boolean;
};

export function TripPointField({
  label,
  value,
  onSelectOnMap,
  required = false,
  optional = false,
}: TripPointFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const resolvedLabel = useResolvedLocationPointLabel(value, '');

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
        {optional ? <AppText style={styles.optional}> (optional)</AppText> : null}
      </AppText>

      {value ? (
        <View style={styles.valueBox}>
          <FontAwesome name="map-marker" size={14} color={colors.primary} />
          <AppText style={styles.valueText} numberOfLines={2}>
            {resolvedLabel}
          </AppText>
        </View>
      ) : (
        <AppText style={styles.placeholder}>{t('trips.create.pointPlaceholder')}</AppText>
      )}

      <Pressable
        onPress={onSelectOnMap}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        accessibilityRole="button"
      >
        <FontAwesome name="map-o" size={13} color={colors.primary} />
        <AppText weight="medium" style={styles.actionText}>
          {t('trips.create.selectOnMap')}
        </AppText>
      </Pressable>
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
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  optional: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  valueBox: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  valueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  placeholder: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  actionButton: {
    minHeight: 42,
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
    fontSize: 13,
  },
});
