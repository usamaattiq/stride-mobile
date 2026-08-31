import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { getFontFamily } from '@/theme/typography';

import type { AdminTabParamList } from './adminNavigationTypes';

type AdminTabLabelProps = {
  routeName: keyof AdminTabParamList;
  color: string;
};

export function AdminTabLabel({ routeName, color }: AdminTabLabelProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();

  return (
    <AppText
      weight="medium"
      style={[
        styles.label,
        { color, fontFamily: getFontFamily(currentLanguage, 'medium') },
      ]}
      numberOfLines={1}
    >
      {t(`admin.tabs.${routeName}`)}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
});
