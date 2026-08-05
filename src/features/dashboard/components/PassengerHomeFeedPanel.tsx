import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { spacing, colors } from '@/theme';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';

import { FeedPaginationBar } from './FeedPaginationBar';
import { ListingCard } from './ListingCard';
import { RequestCategoryChips } from './RequestCategoryChips';
import { RequestSearchRow } from './RequestSearchRow';
import { RequestsEmptyState } from './RequestsEmptyState';
import { TripFilterSheet } from './TripFilterSheet';
import { TripListingsBanner } from './TripListingsBanner';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import {
  countActiveTripBrowseFilters,
  EMPTY_TRIP_BROWSE_FILTERS,
  type TripBrowseFilters,
  type TripListingCategory,
} from '../types/tripBrowse.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const PAGE_SIZE = 5;

export const PassengerHomeFeedPanel = React.memo(function PassengerHomeFeedPanel(): React.ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();

  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [category, setCategory] = React.useState<TripListingCategory>('all');
  const [filters, setFilters] = React.useState<TripBrowseFilters>(EMPTY_TRIP_BROWSE_FILTERS);
  const [page, setPage] = React.useState(1);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState<TripBrowseFilters>(EMPTY_TRIP_BROWSE_FILTERS);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadTrips = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await tripApi.browse({
        q: debouncedQuery || undefined,
        listingType: category === 'all' ? undefined : category,
        paymentMethod: filters.paymentMethod ?? undefined,
        departureCity: filters.departureCity?.label,
        arrivalCity: filters.arrivalCity?.label,
        vehicleMode: filters.vehicleMode ?? undefined,
        minSeats: filters.minSeats ?? undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTrips(result.items.map(mapTripDtoToTrip));
      setTotalPages(result.totalPages);
      if (result.totalPages > 0 && page > result.totalPages) {
        setPage(result.totalPages);
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load trips'));
      setTrips([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [category, debouncedQuery, filters, page]);

  useFocusEffect(
    React.useCallback(() => {
      void loadTrips();
    }, [loadTrips]),
  );

  const { refreshControlProps } = usePullToRefresh(loadTrips);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, filters]);

  const filterCount = countActiveTripBrowseFilters(filters);

  const listHeader = (
    <View style={styles.listHeader}>
      <TripListingsBanner />
      <View style={styles.searchRow}>
        <RequestSearchRow
          query={query}
          onChangeQuery={setQuery}
          filterCount={filterCount}
          onFilterPress={() => {
            setPendingFilters(filters);
            setFilterSheetVisible(true);
          }}
        />
      </View>
      <View style={styles.filtersRow}>
        <View style={styles.chipsWrap}>
          <RequestCategoryChips
            active={category}
            onChange={(next) => setCategory(next as TripListingCategory)}
            variant="listing"
          />
        </View>
        <FeedPaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </View>
    </View>
  );

  const renderItem = React.useCallback(
    ({ item }: { item: Trip }) => (
      <ListingCard
        trip={item}
        onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : loadError ? (
            <View style={styles.centered}>
              <AppText style={styles.errorText}>{loadError}</AppText>
            </View>
          ) : (
            <RequestsEmptyState variant="trips" />
          )
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={FeedSeparator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={PAGE_SIZE}
        windowSize={7}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      />

      <TripFilterSheet
        visible={filterSheetVisible}
        filters={pendingFilters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(nextFilters) => {
          setPendingFilters(nextFilters);
          setFilters(nextFilters);
        }}
      />
    </>
  );
});

function FeedSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  listHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchRow: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipsWrap: {
    flex: 1,
    minWidth: 0,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
