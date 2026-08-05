import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export const DEFAULT_SEATS_MIN = 1;
export const DEFAULT_SEATS_MAX = 60;

type SeatsStepperProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  required?: boolean;
  error?: string;
};

export function SeatsStepper({
  label,
  value,
  onChange,
  min = DEFAULT_SEATS_MIN,
  max = DEFAULT_SEATS_MAX,
  required = false,
  error,
}: SeatsStepperProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const seatCount = Math.max(min, Math.min(max, value));

  return (
    <View style={styles.seatsWrap}>
      <AppText weight="medium" style={styles.seatsLabel}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>
      <View style={[styles.seatsRow, error ? styles.seatsRowError : null]}>
        <AppText weight="semibold" style={styles.seatsCaption} numberOfLines={1}>
          {t('vehicles.seatsCount', { count: seatCount })}
        </AppText>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vehicles.fields.decreaseSeats')}
            disabled={seatCount <= min}
            onPress={() => onChange(seatCount - 1)}
            style={({ pressed }) => [
              styles.stepperButton,
              seatCount <= min && styles.stepperButtonDisabled,
              pressed && seatCount > min && styles.pressed,
            ]}
          >
            <FontAwesome5
              name="minus"
              size={12}
              color={seatCount <= min ? colors.text.tertiary : colors.primary}
              solid
            />
          </Pressable>
          <AppText weight="bold" style={styles.stepperValue}>
            {seatCount}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vehicles.fields.increaseSeats')}
            disabled={seatCount >= max}
            onPress={() => onChange(seatCount + 1)}
            style={({ pressed }) => [
              styles.stepperButton,
              seatCount >= max && styles.stepperButtonDisabled,
              pressed && seatCount < max && styles.pressed,
            ]}
          >
            <FontAwesome5
              name="plus"
              size={12}
              color={seatCount >= max ? colors.text.tertiary : colors.primary}
              solid
            />
          </Pressable>
        </View>
      </View>
      {error ? <AppText style={styles.seatsError}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seatsWrap: {
    gap: spacing.xs,
  },
  seatsLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  seatsRow: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seatsRowError: {
    borderColor: colors.primary,
  },
  seatsCaption: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.45,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  stepperValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text.primary,
  },
  seatsError: {
    fontSize: 12,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
