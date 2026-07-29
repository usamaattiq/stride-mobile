import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

function Block({ style }: { style: Animated.WithAnimatedObject<object> | object }): React.ReactElement {
  return <Animated.View style={[styles.block, style]} />;
}

export function ListingCardSkeleton(): React.ReactElement {
  const pulse = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacityStyle = { opacity: pulse };

  return (
    <View style={styles.item}>
      <View style={styles.mainRow}>
        <Block style={[styles.thumbnail, opacityStyle]} />

        <View style={styles.itemBody}>
          <View style={styles.routeRow}>
            <Block style={[styles.routeCity, opacityStyle]} />
            <Block style={[styles.routeCitySmall, opacityStyle]} />
          </View>

          <Block style={[styles.metaLine, opacityStyle]} />

          <View style={styles.bodyDivider} />

          <View style={styles.detailsPriceRow}>
            <View style={styles.detailsCol}>
              <Block style={[styles.metaLineShort, opacityStyle]} />
              <Block style={[styles.metaLineShort, opacityStyle]} />
            </View>
            <Block style={[styles.priceBlock, opacityStyle]} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Block style={[styles.footerChip, opacityStyle]} />
        <Block style={[styles.footerChip, opacityStyle]} />
        <Block style={[styles.footerBadge, opacityStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  block: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.sm,
  },
  mainRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  thumbnail: {
    width: 88,
    height: 96,
    borderRadius: radius.sm,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeCity: {
    width: 64,
    height: 14,
  },
  routeCitySmall: {
    width: 64,
    height: 14,
  },
  metaLine: {
    width: '70%',
    height: 11,
  },
  bodyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 2,
  },
  detailsPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  metaLineShort: {
    width: '50%',
    height: 11,
  },
  priceBlock: {
    width: 56,
    height: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  footerChip: {
    flex: 1,
    height: 14,
  },
  footerBadge: {
    width: 54,
    height: 20,
    borderRadius: radius.full,
    flexShrink: 0,
  },
});
