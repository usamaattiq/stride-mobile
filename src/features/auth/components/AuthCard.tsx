import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type AuthCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AuthCard({ children, style }: AuthCardProps): React.ReactElement {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.md,
    // borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
});
