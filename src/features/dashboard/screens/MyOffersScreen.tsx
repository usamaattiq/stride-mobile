import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

export function MyOffersScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthScaffold
      title={t('dashboard.offers.title')}
      subtitle={t('dashboard.offers.subtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
    >
      <View style={styles.centered}>
        <AppText style={styles.body}>{t('dashboard.offers.subtitle')}</AppText>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  centered: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  body: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
