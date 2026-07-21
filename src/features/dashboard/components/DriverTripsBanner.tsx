import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type DriverTripsBannerProps = {
  tripCount: number;
  onPress: () => void;
};

export function DriverTripsBanner({
  tripCount,
  onPress,
}: DriverTripsBannerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <AppText weight="bold" style={styles.title}>
          {t('trips.homeBannerTitle')}
        </AppText>
        <AppText style={styles.subtitle}>
          {tripCount > 0
            ? t('trips.homeBannerSubtitleWithCount', { count: tripCount })
            : t('trips.homeBannerSubtitleEmpty')}
        </AppText>
      </View>
      <Button label={t('trips.homeBannerCta')} onPress={onPress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  copy: {
    gap: spacing.xxs,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  button: {
    minHeight: 48,
  },
});
