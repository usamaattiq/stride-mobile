import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';

import { DashboardTabScreen } from '../components/DashboardTabScreen';

export function SettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <DashboardTabScreen
      title={t('dashboard.settings.title')}
      subtitle={t('dashboard.settings.subtitle')}
    />
  );
}
