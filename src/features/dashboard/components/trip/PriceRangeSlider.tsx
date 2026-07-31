import React from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

const THUMB_SIZE = 22;
const MIN_GAP_RATIO = 0.04;

export type PriceRangeValue = {
  min: number | null;
  max: number | null;
};

type PriceRangeSliderProps = {
  floor: number;
  ceiling: number;
  step?: number;
  value: PriceRangeValue;
  onChange: (value: PriceRangeValue) => void;
  formatValue?: (value: number) => string;
};

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function PriceRangeSlider({
  floor,
  ceiling,
  step = 500,
  value,
  onChange,
  formatValue,
}: PriceRangeSliderProps): React.ReactElement {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const range = Math.max(1, ceiling - floor);
  const minGap = range * MIN_GAP_RATIO;

  const currentMin = value.min ?? floor;
  const currentMax = value.max ?? ceiling;

  const valueRef = React.useRef({ min: currentMin, max: currentMax });
  valueRef.current = { min: currentMin, max: currentMax };
  const trackWidthRef = React.useRef(trackWidth);
  trackWidthRef.current = trackWidth;
  const dragStartRef = React.useRef({ min: currentMin, max: currentMax });

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  // Returns the thumb's CENTER x-position, inset by half a thumb width on each
  // side so a thumb's left edge (center - THUMB_SIZE / 2) never goes negative
  // and its right edge never exceeds trackWidth — otherwise the thumb pokes
  // outside the track box and gets clipped by the sheet's padding.
  const positionForValue = (v: number) => {
    if (trackWidth <= 0) {
      return THUMB_SIZE / 2;
    }
    const usableWidth = Math.max(0, trackWidth - THUMB_SIZE);
    return THUMB_SIZE / 2 + ((v - floor) / range) * usableWidth;
  };

  const valueForDelta = (startValue: number, dx: number) => {
    const usableWidth = Math.max(1, trackWidthRef.current - THUMB_SIZE);
    const deltaValue = (dx / usableWidth) * range;
    return snap(startValue + deltaValue, step);
  };

  const minResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = { ...valueRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const next = clamp(
          valueForDelta(dragStartRef.current.min, gesture.dx),
          floor,
          valueRef.current.max - minGap,
        );
        onChange({ min: next, max: valueRef.current.max });
      },
      onPanResponderRelease: () => undefined,
    }),
  ).current;

  const maxResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = { ...valueRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const next = clamp(
          valueForDelta(dragStartRef.current.max, gesture.dx),
          valueRef.current.min + minGap,
          ceiling,
        );
        onChange({ min: valueRef.current.min, max: next });
      },
      onPanResponderRelease: () => undefined,
    }),
  ).current;

  const minLeft = positionForValue(currentMin) - THUMB_SIZE / 2;
  const maxLeft = positionForValue(currentMax) - THUMB_SIZE / 2;
  const fillLeft = positionForValue(currentMin);
  const fillWidth = Math.max(0, positionForValue(currentMax) - positionForValue(currentMin));

  const label = (v: number) => (formatValue ? formatValue(v) : String(Math.round(v)));

  return (
    <View style={styles.root}>
      <View style={styles.valuesRow}>
        <AppText weight="semibold" style={styles.valueText}>
          {label(currentMin)}
        </AppText>
        <AppText style={styles.valueSeparator}>—</AppText>
        <AppText weight="semibold" style={styles.valueText}>
          {label(currentMax)}
        </AppText>
      </View>

      <View style={styles.trackWrap} onLayout={onTrackLayout}>
        <View style={styles.track} />
        <View style={[styles.trackFill, { left: fillLeft, width: fillWidth }]} />

        <View {...minResponder.panHandlers} style={[styles.thumb, { left: minLeft }]} />
        <View {...maxResponder.panHandlers} style={[styles.thumb, { left: maxLeft }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueText: {
    fontSize: 14,
    color: colors.primary,
  },
  valueSeparator: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  trackWrap: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.default,
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
