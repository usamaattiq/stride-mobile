import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { EmptyState } from '@/shared/components/EmptyState';

type RequestsEmptyStateProps = {
  variant?: 'requests' | 'trips';
};

export function RequestsEmptyState({
  variant = 'requests',
}: RequestsEmptyStateProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const titleKey =
    variant === 'trips' ? 'dashboard.home.tripsEmptyTitle' : 'dashboard.home.emptyTitle';
  const subtitleKey =
    variant === 'trips' ? 'dashboard.home.tripsEmptySubtitle' : 'dashboard.home.emptySubtitle';

  return <EmptyState title={t(titleKey)} subtitle={t(subtitleKey)} />;
}
