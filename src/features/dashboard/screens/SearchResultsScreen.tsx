import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { FeedPaginationBar } from '../components/FeedPaginationBar';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { RequestsEmptyState } from '../components/RequestsEmptyState';
import { SearchRouteMap } from '../components/SearchRouteMap';
import { isSameLocalDay } from '../components/trip/dateRangeUtils';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';

const PAGE_SIZE = 5;
const SKELETON_KEYS = [0, 1, 2];
const CARD_OVERLAP = 14;

export function SearchResultsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList, 'SearchResults'>>();
  const route = useRoute<RouteProp<DashboardRootStackParamList, 'SearchResults'>>();
  const {
    departureCity,
    arrivalCity,
    departureDateISO,
    vehicleMode,
    passengerCount,
  } = route.params;

  const departureDate = React.useMemo(
    () => new Date(departureDateISO),
    [departureDateISO],
  );

  const [page, setPage] = React.useState(1);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const onMapReady = React.useCallback(() => setMapReady(true), []);

  const fromLabel = cityDisplayName(departureCity.label);
  const toLabel = cityDisplayName(arrivalCity.label);
  const routeTitle = `${fromLabel} → ${toLabel}`;

  const loadTrips = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await tripApi.browse({
        departureCity: departureCity.label,
        arrivalCity: arrivalCity.label,
        vehicleMode,
        minSeats: passengerCount,
        page: 1,
        limit: 50,
      });

      const mapped = result.items.map(mapTripDtoToTrip);
      const dayFiltered = mapped.filter((trip) =>
        isSameLocalDay(new Date(trip.departureAt), departureDate),
      );

      const total = dayFiltered.length;
      const pages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);
      const safePage = pages > 0 ? Math.min(page, pages) : 1;
      const start = (safePage - 1) * PAGE_SIZE;
      setTrips(dayFiltered.slice(start, start + PAGE_SIZE));
      setTotalPages(pages);
      if (safePage !== page) {
        setPage(safePage);
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load trips'));
      setTrips([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [arrivalCity.id, departureCity.id, departureDate, page, passengerCount, vehicleMode]);

  React.useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const listHeader = totalPages > 1 ? (
    <View style={styles.paginationWrap}>
      <FeedPaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </View>
  ) : null;

  const skeletonList = (
    <View style={styles.cardPad}>
      {SKELETON_KEYS.map((key) => (
        <View key={key} style={styles.skeletonItem}>
          <ListingCardSkeleton />
        </View>
      ))}
    </View>
  );

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={routeTitle}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      centerTitleInTopBar
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
    >
      {/* Map sits in the grey/white area just below the red header */}
      <SearchRouteMap departureLabel={fromLabel} arrivalLabel={toLabel} onReady={onMapReady} />

      {/* White card overlaps the bottom of the map */}
      <View style={[styles.resultsCard, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {mapReady ? (
          <>
            <View style={styles.availableTripsHeader}>
              <AppText weight="bold" style={styles.availableTripsText}>
                {t('dashboard.search.results.availableTrips')}
              </AppText>
            </View>
            <FlatList
              data={trips}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.cardPad}>
                  <ListingCard
                    trip={item}
                    onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
                  />
                </View>
              )}
              ListHeaderComponent={listHeader}
              ListEmptyComponent={
                isLoading ? (
                  skeletonList
                ) : loadError ? (
                  <View style={styles.centered}>
                    <AppText style={styles.errorText}>{loadError}</AppText>
                  </View>
                ) : (
                  <View style={styles.cardPad}>
                    <RequestsEmptyState variant="trips" />
                  </View>
                )
              }
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </>
        ) : (
          skeletonList
        )}
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  resultsCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -CARD_OVERLAP,
    overflow: 'hidden',
  },
  availableTripsHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  availableTripsText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  paginationWrap: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  cardPad: {
    paddingHorizontal: spacing.md,
  },
  skeletonItem: {
    marginTop: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
