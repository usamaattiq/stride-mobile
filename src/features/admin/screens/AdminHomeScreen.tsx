import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminHomeStats } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

import { UsersByDateChart } from '../components/UsersByDateChart';
import { useAdminResource } from '../hooks/useAdminResource';

const STAT_CARDS: {
  key: keyof Pick<
    AdminHomeStats,
    'totalUsers' | 'totalTrips' | 'tripsByDrivers' | 'tripsByPassengers'
  >;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  labelKey: string;
  accent: string;
}[] = [
  { key: 'totalUsers', icon: 'users', labelKey: 'admin.home.totalUsers', accent: colors.accent.blue.text },
  { key: 'totalTrips', icon: 'map', labelKey: 'admin.home.totalTrips', accent: colors.primary },
  { key: 'tripsByDrivers', icon: 'car', labelKey: 'admin.home.tripsByDrivers', accent: colors.accent.green.text },
  { key: 'tripsByPassengers', icon: 'user', labelKey: 'admin.home.tripsByPassengers', accent: colors.accent.amber.text },
];

export function AdminHomeScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;
  const { data, loading, errorKey, reload } = useAdminResource({
    reloadOnFocus: true,
    load: () => adminApi.getHomeStats(),
  });
  const { refreshControlProps } = usePullToRefresh(reload);

  return (
    <AuthScaffold
      title={t('admin.home.title')}
      subtitle={t('admin.home.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
    >
      {errorKey ? <AppText style={styles.error}>{t(errorKey)}</AppText> : null}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        <View style={styles.grid}>
          {STAT_CARDS.map((card) => (
            <View key={card.key} style={styles.statGutter}>
              <View style={styles.statShadow}>
                <LinearGradient
                  colors={['#FFFFFF', '#FFF8F7', '#FEE8E6']}
                  start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
                  end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                  style={styles.statCard}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${card.accent}22` }]}>
                    <FontAwesome name={card.icon} size={16} color={card.accent} />
                  </View>
                  <AppText style={styles.statLabel}>{t(card.labelKey)}</AppText>
                  <AppText weight="bold" style={styles.statValue}>
                    {loading && !data ? '—' : data?.[card.key] ?? 0}
                  </AppText>
                </LinearGradient>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.chartWrap}>
          <UsersByDateChart
            title={t('admin.home.usersByDate')}
            emptyLabel={t('admin.home.chartEmpty')}
            points={data?.usersByDate ?? []}
          />
        </View>
      </ScrollView>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.huge,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  statGutter: {
    width: '50%',
    padding: spacing.sm,
  },
  statShadow: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...cardBackShadow,
  },
  statCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.md,
    minHeight: 118,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: 26,
    color: colors.text.primary,
  },
  chartWrap: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
