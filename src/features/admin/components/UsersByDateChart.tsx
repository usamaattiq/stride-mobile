import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

type UsersByDateChartProps = {
  title: string;
  points: { date: string; count: number }[];
  emptyLabel: string;
};

export function UsersByDateChart({
  title,
  points,
  emptyLabel,
}: UsersByDateChartProps): React.ReactElement {
  const max = Math.max(1, ...points.map((point) => point.count));
  const isRtl = I18nManager.isRTL;

  return (
    <View style={styles.shadowGutter}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#FFFFFF', '#FFF8F7', '#FEE8E6']}
          start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
          end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
          style={styles.inner}
        >
          <AppText weight="bold" style={styles.title}>
            {title}
          </AppText>
          {points.every((point) => point.count === 0) ? (
            <AppText style={styles.empty}>{emptyLabel}</AppText>
          ) : (
            <View style={styles.chart}>
              {points.map((point) => {
                const height = Math.max(6, Math.round((point.count / max) * 120));
                const day = point.date.slice(8);
                return (
                  <View key={point.date} style={styles.col}>
                    <AppText style={styles.value}>{point.count || ''}</AppText>
                    <View style={styles.track}>
                      <LinearGradient
                        colors={[colors.primary, '#F97066']}
                        start={{ x: 0.5, y: 1 }}
                        end={{ x: 0.5, y: 0 }}
                        style={[styles.bar, { height }]}
                      />
                    </View>
                    <AppText style={styles.day}>{day}</AppText>
                  </View>
                );
              })}
            </View>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  card: {
    borderRadius: radius.lg,
    ...cardBackShadow,
  },
  inner: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
  },
  empty: {
    fontSize: 13,
    color: colors.text.secondary,
    paddingVertical: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    minHeight: 160,
    paddingTop: spacing.sm,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 9,
    color: colors.text.secondary,
    minHeight: 12,
  },
  track: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 6,
  },
  day: {
    fontSize: 9,
    color: colors.text.tertiary,
  },
});
