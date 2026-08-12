import React from 'react';
import {
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PanResponderInstance,
} from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

const THUMB_SIZE = 22;
const HIT_SLOP = 14;
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
  /** Called while a thumb is being dragged — use to lock parent ScrollView on iOS. */
  onDraggingChange?: (dragging: boolean) => void;
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
  onDraggingChange,
}: PriceRangeSliderProps): React.ReactElement {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const range = Math.max(1, ceiling - floor);
  const minGap = Math.max(step, range * MIN_GAP_RATIO);

  const currentMin = value.min ?? floor;
  const currentMax = value.max ?? ceiling;

  const valueRef = React.useRef({ min: currentMin, max: currentMax });
  valueRef.current = { min: currentMin, max: currentMax };
  const trackWidthRef = React.useRef(trackWidth);
  trackWidthRef.current = trackWidth;
  const dragStartRef = React.useRef({ min: currentMin, max: currentMax });
  const floorRef = React.useRef(floor);
  floorRef.current = floor;
  const ceilingRef = React.useRef(ceiling);
  ceilingRef.current = ceiling;
  const stepRef = React.useRef(step);
  stepRef.current = step;
  const minGapRef = React.useRef(minGap);
  minGapRef.current = minGap;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const onDraggingChangeRef = React.useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== trackWidthRef.current) {
      setTrackWidth(nextWidth);
    }
  };

  // Thumb CENTER x — inset by half a thumb so edges stay inside the track.
  const positionForValue = (v: number) => {
    if (trackWidth <= 0) {
      return THUMB_SIZE / 2;
    }
    const usableWidth = Math.max(0, trackWidth - THUMB_SIZE);
    return THUMB_SIZE / 2 + ((v - floor) / range) * usableWidth;
  };

  const valueForDelta = (startValue: number, dx: number) => {
    const usableWidth = Math.max(1, trackWidthRef.current - THUMB_SIZE);
    const deltaValue = (dx / usableWidth) * (ceilingRef.current - floorRef.current);
    return snap(startValue + deltaValue, stepRef.current);
  };

  const beginDrag = React.useCallback(() => {
    dragStartRef.current = { ...valueRef.current };
    onDraggingChangeRef.current?.(true);
  }, []);

  const endDrag = React.useCallback(() => {
    onDraggingChangeRef.current?.(false);
  }, []);

  const createThumbResponder = React.useCallback(
    (thumb: 'min' | 'max'): PanResponderInstance =>
      PanResponder.create({
        // Claim the gesture before ScrollView on iOS.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: beginDrag,
        onPanResponderMove: (_, gesture) => {
          if (thumb === 'min') {
            const next = clamp(
              valueForDelta(dragStartRef.current.min, gesture.dx),
              floorRef.current,
              valueRef.current.max - minGapRef.current,
            );
            onChangeRef.current({ min: next, max: valueRef.current.max });
            return;
          }
          const next = clamp(
            valueForDelta(dragStartRef.current.max, gesture.dx),
            valueRef.current.min + minGapRef.current,
            ceilingRef.current,
          );
          onChangeRef.current({ min: valueRef.current.min, max: next });
        },
        onPanResponderRelease: endDrag,
        onPanResponderTerminate: endDrag,
      }),
    [beginDrag, endDrag],
  );

  const minResponder = React.useMemo(() => createThumbResponder('min'), [createThumbResponder]);
  const maxResponder = React.useMemo(() => createThumbResponder('max'), [createThumbResponder]);

  const minLeft = positionForValue(currentMin) - THUMB_SIZE / 2;
  const maxLeft = positionForValue(currentMax) - THUMB_SIZE / 2;
  const fillLeft = positionForValue(currentMin);
  const fillWidth = Math.max(0, positionForValue(currentMax) - positionForValue(currentMin));

  const label = (v: number) => (formatValue ? formatValue(v) : String(Math.round(v)));

  return (
    <View style={styles.root} collapsable={false}>
      <View style={styles.valuesRow}>
        <AppText weight="semibold" style={styles.valueText}>
          {label(currentMin)}
        </AppText>
        <AppText style={styles.valueSeparator}>—</AppText>
        <AppText weight="semibold" style={styles.valueText}>
          {label(currentMax)}
        </AppText>
      </View>

      <View
        style={styles.trackWrap}
        onLayout={onTrackLayout}
        collapsable={false}
      >
        <View style={styles.track} pointerEvents="none" />
        <View
          pointerEvents="none"
          style={[styles.trackFill, { left: fillLeft, width: fillWidth }]}
        />

        <View
          {...minResponder.panHandlers}
          hitSlop={HIT_SLOP}
          style={[styles.thumbHit, { left: minLeft - HIT_SLOP }]}
          // Keep min under max when they meet so the free thumb stays tappable.
          accessibilityRole="adjustable"
          accessibilityLabel="Minimum price"
        >
          <View style={styles.thumb} />
        </View>
        <View
          {...maxResponder.panHandlers}
          hitSlop={HIT_SLOP}
          style={[styles.thumbHit, { left: maxLeft - HIT_SLOP, zIndex: 2 }]}
          accessibilityRole="adjustable"
          accessibilityLabel="Maximum price"
        >
          <View style={styles.thumb} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    width: '100%',
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
    height: THUMB_SIZE + HIT_SLOP * 2,
    justifyContent: 'center',
    width: '100%',
    // iOS clips absolute thumbs if the parent is too tight; keep room for hit area.
    overflow: 'visible',
  },
  track: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.default,
  },
  trackFill: {
    position: 'absolute',
    top: (THUMB_SIZE + HIT_SLOP * 2 - 4) / 2,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  thumbHit: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE + HIT_SLOP * 2,
    height: THUMB_SIZE + HIT_SLOP * 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Larger touch target without changing the visible thumb.
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : null),
  },
  thumb: {
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
