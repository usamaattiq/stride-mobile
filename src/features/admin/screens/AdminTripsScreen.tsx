import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { ListingCard } from '@/features/dashboard/components/ListingCard';
import { ListingCardSkeleton } from '@/features/dashboard/components/ListingCardSkeleton';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { RouteTypeFilterChips } from '@/features/dashboard/components/RouteTypeFilterChips';
import { SegmentControl } from '@/features/dashboard/components/SegmentControl';
import type { TripRouteType } from '@/features/dashboard/types/trip.types';
import type { TripListingCategory } from '@/features/dashboard/types/tripBrowse.types';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminTripSummary } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminTripsStackParamList } from '../navigation/adminNavigationTypes';
import { mapAdminTripSummaryToTrip } from '../utils/admin.mapper';

const SKELETON_COUNT = 4;

function ListSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

export function AdminTripsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<NativeStackNavigationProp<AdminTripsStackParamList>>();
  const [listingCategory, setListingCategory] =
    React.useState<TripListingCategory>('all');
  const [routeType, setRouteType] = React.useState<TripRouteType | null>(null);

  const { data, loading, errorKey, reload } = useAdminResource({
    load: async () => {
      const result = await adminApi.listTrips();
      return result.items;
    },
  });

  const trips = data ?? [];
  const visibleTrips = React.useMemo(
    () =>
      trips.filter((trip) => {
        const matchesCategory =
          listingCategory === 'all' || trip.listingType === listingCategory;
        const matchesRouteType = routeType === null || trip.routeType === routeType;
        return matchesCategory && matchesRouteType;
      }),
    [listingCategory, routeType, trips],
  );
  const { refreshControlProps } = usePullToRefresh(reload);

  const typeOptions = React.useMemo(
    () => [
      { id: 'all' as const, label: t('dashboard.home.categoryAllListings') },
      { id: 'rfq' as const, label: t('dashboard.home.categoryRfq') },
      { id: 'auction' as const, label: t('dashboard.home.categoryAuction') },
    ],
    [t],
  );

  const renderTrip = React.useCallback<ListRenderItem<AdminTripSummary>>(
    ({ item }) => (
      <ListingCard
        trip={mapAdminTripSummaryToTrip(item)}
        onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
      />
    ),
    [navigation],
  );

  const listEmpty = loading ? (
    <View style={styles.skeletonList}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <ListingCardSkeleton key={`trip-skeleton-${index}`} />
      ))}
    </View>
  ) : (
    <ListingsEmptyState
      variant={trips.length > 0 ? 'filtered' : 'none'}
      title={t('admin.trips.empty')}
      subtitle={t('admin.trips.subtitle')}
      icon="map-marked-alt"
    />
  );

  return (
    <AuthScaffold
      title={t('admin.trips.title')}
      subtitle={t('admin.trips.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
      headerExtra={
        <SegmentControl
          variant="onBrand"
          options={typeOptions}
          value={listingCategory}
          onChange={setListingCategory}
        />
      }
    >
      <View style={styles.filters}>
        <RouteTypeFilterChips value={routeType} onChange={setRouteType} />
      </View>

      {errorKey ? (
        <AppText style={styles.error}>{t(errorKey)}</AppText>
      ) : null}

      <FlatList
        data={visibleTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  filters: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge + spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  skeletonList: {
    gap: spacing.sm,
    paddingTop: 8,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
