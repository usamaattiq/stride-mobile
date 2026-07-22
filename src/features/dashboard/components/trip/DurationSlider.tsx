import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

const MIN_HOURS = 1;
const MAX_HOURS = 24;

type DurationSliderProps = {
  value: number;
  onChange: (hours: number) => void;
  label: string;
};

export function DurationSlider({ value, onChange, label }: DurationSliderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const hours = Array.from({ length: MAX_HOURS }, (_, index) => index + 1);

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
      </AppText>
      <AppText weight="semibold" style={styles.value}>
        {t('trips.create.durationValue', { count: value })}
      </AppText>

      <Slider
        style={styles.slider}
        minimumValue={MIN_HOURS}
        maximumValue={MAX_HOURS}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border.default}
        thumbTintColor={colors.primary}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ticks}
      >
        {hours.map((hour) => {
          const selected = hour === value;
          return (
            <Pressable
              key={hour}
              onPress={() => onChange(hour)}
              style={[styles.tick, selected && styles.tickSelected]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t('trips.create.durationValue', { count: hour })}
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
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  tick: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.subtle,
  },
  tickSelected: {
    backgroundColor: colors.primarySoft,
  },
  tickLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  tickLabelSelected: {
    color: colors.primary,
  },
});
