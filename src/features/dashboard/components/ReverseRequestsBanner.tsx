import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export function ReverseRequestsBanner(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <LinearGradient
      colors={[colors.primarySoft, '#FFF7ED', colors.white]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <View style={styles.copy}>
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.home.bannerTitle')}
        </AppText>
        <AppText style={styles.subtitle}>{t('dashboard.home.bannerSubtitle')}</AppText>
      </View>
      <View style={styles.art}>
        <FontAwesome5 name="bus" size={42} color={colors.primary} solid />
        <View style={styles.pinRow}>
          <FontAwesome5 name="map-marker-alt" size={12} color={colors.accent.purple.text} />
          <View style={styles.routeLine} />
          <FontAwesome5 name="map-marker-alt" size={12} color={colors.primary} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontSize: 18,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  art: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.xs,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeLine: {
    width: 28,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.border.strong,
  },
});
