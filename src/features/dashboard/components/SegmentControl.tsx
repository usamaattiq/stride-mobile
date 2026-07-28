import React from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Fractional tab index (0..options.length-1) for swipe-synced thumb movement. */
  animatedIndex?: Animated.AnimatedInterpolation<number>;
  /** `onBrand` = translucent white thumb for primary/red headers. */
  variant?: 'default' | 'onBrand';
};

/** Equal gap between the active thumb and the track border on every side. */
const THUMB_INSET = 3;

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  animatedIndex,
  variant = 'default',
}: SegmentControlProps<T>): React.ReactElement {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const [innerWidth, setInnerWidth] = React.useState(0);
  const thumbX = React.useRef(new Animated.Value(selectedIndex)).current;
  const isOnBrand = variant === 'onBrand';

  React.useEffect(() => {
    if (animatedIndex) {
      return;
    }
    Animated.spring(thumbX, {
      toValue: selectedIndex,
      useNativeDriver: true,
      tension: 260,
      friction: 26,
    }).start();
  }, [animatedIndex, selectedIndex, thumbX]);

  const onInnerLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setInnerWidth((current) => (Math.abs(current - nextWidth) < 0.5 ? current : nextWidth));
  };

  const segmentCount = Math.max(options.length, 1);
  // Floor so leftover sub-pixels don't push the right thumb into the border.
  const thumbWidth =
    innerWidth > 0 ? Math.floor((innerWidth / segmentCount) * 10) / 10 : 0;
  const thumbTranslateX = React.useMemo(() => {
    const inputRange = options.map((_, index) => index);
    const outputRange = options.map((_, index) => index * thumbWidth);

    if (animatedIndex) {
      return animatedIndex.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
      });
    }

    return thumbX.interpolate({
      inputRange,
      outputRange,
    });
  }, [animatedIndex, options, thumbWidth, thumbX]);

  return (
    <View
      style={[styles.track, isOnBrand && styles.trackOnBrand]}
      accessibilityRole="tablist"
    >
      <View style={styles.inner} onLayout={onInnerLayout}>
        {innerWidth > 0 && thumbWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              isOnBrand && styles.thumbOnBrand,
              {
                width: thumbWidth,
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          />
        ) : null}
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => [styles.segment, pressed && styles.pressed]}
            >
              <AppText
                weight={selected ? 'bold' : 'medium'}
                style={[
                  styles.label,
                  isOnBrand && styles.labelOnBrand,
                  selected && (isOnBrand ? styles.labelSelectedOnBrand : styles.labelSelected),
                ]}
                numberOfLines={1}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    // Padding creates the same gap on left/right/top/bottom around the thumb.
    padding: THUMB_INSET,
  },
  trackOnBrand: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    minHeight: 42,
  },
  inner: {
    flexGrow: 1,
    flexDirection: 'row',
    position: 'relative',
    minHeight: 36,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  thumbOnBrand: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  segment: {
    flex: 1,
    zIndex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  labelOnBrand: {
    fontSize: 14,
    color: colors.text.onBrandMuted,
  },
  labelSelected: {
    color: colors.primary,
  },
  labelSelectedOnBrand: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
