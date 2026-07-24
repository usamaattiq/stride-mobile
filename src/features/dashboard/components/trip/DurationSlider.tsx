import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const SLIDER_STEP_HOURS = 0.5;
const TICK_STEP_HOURS = 3;

const TICK_HOURS = Array.from(
  { length: Math.floor(MAX_HOURS / TICK_STEP_HOURS) },
  (_, index) => (index + 1) * TICK_STEP_HOURS,
);

type DurationSliderProps = {
  value: number;
  onChange: (hours: number) => void;
  label: string;
};

function snapToHalfHour(hours: number): number {
  const snapped = Math.round(hours / SLIDER_STEP_HOURS) * SLIDER_STEP_HOURS;
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, Number(snapped.toFixed(1))));
}

function formatDurationLabel(
  hours: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return t('trips.create.durationValue', { count: wholeHours });
  }
  if (wholeHours === 0) {
    return t('trips.create.durationMinutesOnly', { count: minutes });
  }
  return t('trips.create.durationHoursMinutes', {
    hours: wholeHours,
    minutes,
  });
}

export function DurationSlider({ value, onChange, label }: DurationSliderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const safeValue = snapToHalfHour(value);

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
      </AppText>
      <AppText weight="semibold" style={styles.value}>
        {formatDurationLabel(safeValue, t)}
      </AppText>

      <Slider
        style={styles.slider}
        minimumValue={MIN_HOURS}
        maximumValue={MAX_HOURS}
        step={SLIDER_STEP_HOURS}
        value={safeValue}
        onValueChange={(next) => onChange(snapToHalfHour(next))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border.default}
        thumbTintColor={colors.primary}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ticks}
      >
        {TICK_HOURS.map((hour) => {
          const selected = hour === safeValue;
          return (
            <Pressable
              key={hour}
              onPress={() => onChange(hour)}
              style={[styles.tick, selected && styles.tickSelected]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={formatDurationLabel(hour, t)}
            >
              <AppText
                weight={selected ? 'semibold' : 'regular'}
                style={[styles.tickLabel, selected && styles.tickLabelSelected]}
              >
                {hour}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
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
  value: {
    fontSize: 15,
    color: colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ticks: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  tick: {
    minWidth: 36,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.subtle,
  },
  tickSelected: {
    backgroundColor: colors.primarySoft,
  },
  tickLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  tickLabelSelected: {
    color: colors.primary,
  },
});
