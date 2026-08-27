import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { formatLatinNumber } from '@/shared/utils/latin-digits';
import { colors, radius } from '@/theme';

type CreditCostBadgeProps = {
  count: number;
};

export function CreditCostBadge({ count }: CreditCostBadgeProps): React.ReactElement {
  return (
    <View style={styles.badge}>
      <FontAwesome5 name="coins" size={12} color={colors.accent.coins} solid />
      <AppText weight="bold" style={styles.text}>
        {formatLatinNumber(count)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  text: {
    fontSize: 13,
    color: colors.white,
  },
});
