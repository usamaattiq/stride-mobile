import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export function MessageLegend(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.accent.unread }]} />
        <AppText style={styles.label}>{t('dashboard.messages.legendUnread')}</AppText>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.accent.read }]} />
        <AppText style={styles.label}>{t('dashboard.messages.legendRead')}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 11,
    color: colors.text.secondary,
  },
});
