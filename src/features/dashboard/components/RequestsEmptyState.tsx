import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

export function RequestsEmptyState(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <FontAwesome5 name="route" size={32} color={colors.text.tertiary} />
      <AppText weight="semibold" style={styles.title}>
        {t('dashboard.home.emptyTitle')}
      </AppText>
      <AppText style={styles.subtitle}>{t('dashboard.home.emptySubtitle')}</AppText>
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
    gap: spacing.xs,
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
