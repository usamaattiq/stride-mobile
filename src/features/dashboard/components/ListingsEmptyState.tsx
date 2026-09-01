import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { EmptyState } from '@/shared/components/EmptyState';

type ListingsEmptyStateProps = {
  variant?: 'none' | 'filtered';
  title?: string;
  subtitle?: string;
};

export function ListingsEmptyState({
  variant = 'none',
  title: titleOverride,
  subtitle: subtitleOverride,
}: ListingsEmptyStateProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const title =
    titleOverride ??
    (variant === 'filtered'
      ? t('dashboard.home.listingsFilterEmptyTitle')
      : t('dashboard.listings.emptyTitle'));
  const subtitle =
    subtitleOverride ??
    (variant === 'filtered'
      ? t('dashboard.home.listingsFilterEmptySubtitle')
      : t('dashboard.listings.emptySubtitle'));

  return <EmptyState title={title} subtitle={subtitle} />;
}
