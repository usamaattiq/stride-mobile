import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { EmptyState } from '@/shared/components/EmptyState';

export function MessagesEmptyState(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <EmptyState
      title={t('dashboard.messages.emptyTitle')}
      subtitle={t('dashboard.messages.emptySubtitle')}
    />
  );
}
