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
};

const TRACK_PADDING = 3;

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  animatedIndex,
}: SegmentControlProps<T>): React.ReactElement {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const [trackWidth, setTrackWidth] = React.useState(0);
  const thumbX = React.useRef(new Animated.Value(selectedIndex)).current;

  React.useEffect(() => {
    if (animatedIndex) {
      return;
    }
    Animated.spring(thumbX, {
      toValue: selectedIndex,
      useNativeDriver: true,
      tension: 280,
      friction: 28,
    }).start();
  }, [animatedIndex, selectedIndex, thumbX]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const segmentCount = Math.max(options.length, 1);
  const innerWidth = Math.max(trackWidth - TRACK_PADDING * 2, 0);
  const thumbWidth = innerWidth / segmentCount;
  const thumbTranslateX = React.useMemo(() => {
    const inputRange = options.map((_, index) => index);
    const outputRange = options.map((_, index) => TRACK_PADDING + index * thumbWidth);

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
      style={styles.track}
      accessibilityRole="tablist"
      onLayout={onTrackLayout}
    >
      {trackWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
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
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    position: 'relative',
    padding: TRACK_PADDING,
    borderRadius: radius.full,
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
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
  labelSelected: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});
