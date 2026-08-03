import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

type ListingsEmptyStateProps = {
  variant?: 'none' | 'filtered';
};

export function ListingsEmptyState({
  variant = 'none',
}: ListingsEmptyStateProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const title =
    variant === 'filtered'
      ? t('dashboard.home.listingsFilterEmptyTitle')
      : t('dashboard.listings.emptyTitle');
  const subtitle =
    variant === 'filtered'
      ? t('dashboard.home.listingsFilterEmptySubtitle')
      : t('dashboard.listings.emptySubtitle');

  return (
    <View style={styles.root}>
      <FontAwesome5
        name={variant === 'filtered' ? 'search' : 'clipboard-list'}
        size={36}
        color={colors.text.tertiary}
      />
      <AppText weight="semibold" style={styles.title}>
        {title}
      </AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
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
    gap: spacing.sm,
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
