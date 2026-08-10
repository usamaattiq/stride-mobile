import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const SLIDER_STEP_HOURS = 0.5;
const TICK_HOURS = [6, 12, 18, 24];
/** Dev shortcut for fast auction end-to-end testing. */
const DEV_THREE_MINUTES_HOURS = 3 / 60;

type DurationSliderProps = {
  value: number;
  onChange: (hours: number) => void;
  label: string;
};

function isDevThreeMinutes(hours: number): boolean {
  return Math.abs(hours - DEV_THREE_MINUTES_HOURS) < 1e-8;
}

function snapToHalfHour(hours: number): number {
  if (isDevThreeMinutes(hours)) {
    return DEV_THREE_MINUTES_HOURS;
  }
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
  const isDevSelected = isDevThreeMinutes(safeValue);

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
        value={isDevSelected ? MIN_HOURS : safeValue}
        onValueChange={(next) => onChange(snapToHalfHour(next))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border.default}
        thumbTintColor={colors.primary}
      />

      <View style={styles.ticks}>
        {TICK_HOURS.map((hour) => {
          const selected = !isDevSelected && hour === safeValue;
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
      </View>

      {__DEV__ ? (
        <Pressable
          onPress={() => onChange(DEV_THREE_MINUTES_HOURS)}
          style={[styles.devButton, isDevSelected && styles.tickSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: isDevSelected }}
          accessibilityLabel={t('trips.create.durationDevThreeMinutes')}
        >
          <AppText
            weight={isDevSelected ? 'semibold' : 'regular'}
            style={[styles.tickLabel, isDevSelected && styles.tickLabelSelected]}
          >
            {t('trips.create.durationDevThreeMinutes')}
          </AppText>
        </Pressable>
      ) : null}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  devButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.subtle,
  },
});
