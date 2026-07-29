import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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

import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { RequestsEmptyState } from '../components/RequestsEmptyState';
import { SearchResultsFilterSheet } from '../components/SearchResultsFilterSheet';
import { SearchRouteMap } from '../components/SearchRouteMap';
import { isSameLocalDay } from '../components/trip/dateRangeUtils';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import {
  countActiveSearchResultsFilters,
  EMPTY_SEARCH_RESULTS_FILTERS,
  type SearchResultsFilters,
} from '../types/tripBrowse.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';

const SKELETON_KEYS = [0, 1, 2];
const CARD_OVERLAP = 14;

function parsePrice(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function matchesPriceRange(trip: Trip, priceRange: SearchResultsFilters['priceRange']): boolean {
  if (priceRange.min == null && priceRange.max == null) {
    return true;
  }
  const price = parsePrice(trip.startingPrice);
  if (price == null) {
    return false;
  }
  if (priceRange.min != null && price < priceRange.min) {
    return false;
  }
  if (priceRange.max != null && price > priceRange.max) {
    return false;
  }
  return true;
}

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

  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [resultsCount, setResultsCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const onMapReady = React.useCallback(() => setMapReady(true), []);
  const [filters, setFilters] = React.useState<SearchResultsFilters>(EMPTY_SEARCH_RESULTS_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
  const filterCount = countActiveSearchResultsFilters(filters);

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
        listingType: filters.listingType ?? undefined,
        paymentMethod: filters.paymentMethod ?? undefined,
        vehicleClass: filters.vehicleClass ?? undefined,
        page: 1,
        limit: 50,
      });

      const mapped = result.items.map(mapTripDtoToTrip);
      const filtered = mapped.filter(
        (trip) =>
          isSameLocalDay(new Date(trip.departureAt), departureDate) &&
          matchesPriceRange(trip, filters.priceRange),
      );

      setTrips(filtered);
      setResultsCount(filtered.length);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load trips'));
      setTrips([]);
      setResultsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [arrivalCity.id, departureCity.id, departureDate, filters, passengerCount, vehicleMode]);

  React.useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

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
                {t('dashboard.search.results.tripsFound', { count: resultsCount })}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.home.filterA11y')}
                onPress={() => setFilterSheetVisible(true)}
                style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
              >
                <FontAwesome name="sliders" size={14} color={colors.text.primary} />
                {filterCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <AppText weight="bold" style={styles.filterBadgeText}>
                      {String(filterCount)}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
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

      <SearchResultsFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxs,
  },
  availableTripsText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 11,
  },
  pressed: {
    opacity: 0.85,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
