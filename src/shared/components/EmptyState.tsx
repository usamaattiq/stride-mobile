import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ title, subtitle, style }: EmptyStateProps): React.ReactElement {
  return (
    <View style={[styles.root, style]}>
      <Image
        source={require('../../../assets/no_item.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <AppText weight="semibold" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xxs,
  },
  icon: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
