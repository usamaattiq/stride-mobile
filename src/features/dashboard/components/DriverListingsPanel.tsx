import React from 'react';
import {
  Animated,
  Dimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { RequestSearchRow } from './RequestSearchRow';
import { SegmentControl } from './SegmentControl';
import { TripFilterSheet } from './TripFilterSheet';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip, TripListingType } from '../types/trip.types';
import {
  countActiveTripBrowseFilters,
  EMPTY_TRIP_BROWSE_FILTERS,
  type TripBrowseFilters,
} from '../types/tripBrowse.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const SKELETON_COUNT = 3;
const LISTING_TYPES: TripListingType[] = ['rfq', 'auction'];
const PAGE_SIZE = 20;
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - spacing.md * 2;

function matchesQuery(trip: Trip, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = [
    trip.departureCity.label,
    trip.arrivalCity.label,
    trip.vehicleTitle ?? '',
    trip.vehicleClass ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalized);
}

function matchesFilters(trip: Trip, filters: TripBrowseFilters): boolean {
  if (filters.paymentMethod && trip.paymentMethod !== filters.paymentMethod) {
    return false;
  }
  if (filters.vehicleMode && trip.vehicleMode !== filters.vehicleMode) {
    return false;
  }
  if (filters.minSeats != null && (trip.vehicleTotalSeats ?? 0) < filters.minSeats) {
    return false;
  }
  if (
    filters.departureCity &&
    cityDisplayName(trip.departureCity.label).toLowerCase() !==
      cityDisplayName(filters.departureCity.label).toLowerCase()
  ) {
    return false;
  }
  if (
    filters.arrivalCity &&
    cityDisplayName(trip.arrivalCity.label).toLowerCase() !==
      cityDisplayName(filters.arrivalCity.label).toLowerCase()
  ) {
    return false;
  }
  return true;
}

export const DriverListingsPanel = React.memo(function DriverListingsPanel(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();

  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isScreenLoading, setIsScreenLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [listingType, setListingType] = React.useState<TripListingType>('rfq');
  const [filters, setFilters] = React.useState<TripBrowseFilters>(EMPTY_TRIP_BROWSE_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
  const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
  const pagerRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const typeOptions = React.useMemo(
    () => [
      { id: 'rfq' as const, label: t('dashboard.home.categoryRfq') },
      { id: 'auction' as const, label: t('dashboard.home.categoryAuction') },
    ],
    [t],
  );

  const loadRequests = React.useCallback(async () => {
    setIsScreenLoading(true);
    setLoadError(null);
    try {
      const result = await tripApi.browse({
        kind: 'requests',
        page: 1,
        limit: PAGE_SIZE,
      });
      setTrips(result.items.map(mapTripDtoToTrip));
    } catch (error) {
      setLoadError(getErrorMessage(error, t('dashboard.home.requestsLoadFailed')));
      setTrips([]);
    } finally {
      setIsScreenLoading(false);
    }
  }, [t]);

  const { refreshControlProps } = usePullToRefresh(loadRequests);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void loadRequests().finally(() => {
        if (cancelled) {
          return;
        }
      });
      return () => {
        cancelled = true;
      };
    }, [loadRequests]),
  );

  const selectListingType = React.useCallback(
    (next: TripListingType, animated = true) => {
      setListingType(next);
      if (pageWidth <= 0) {
        return;
      }
      const index = LISTING_TYPES.indexOf(next);
      pagerRef.current?.scrollTo({ x: index * pageWidth, animated });
      if (!animated) {
        scrollX.setValue(index * pageWidth);
      }
    },
    [pageWidth, scrollX],
  );

  const animatedTypeIndex = React.useMemo(() => {
    if (pageWidth <= 0) {
      return undefined;
    }
    return scrollX.interpolate({
      inputRange: [0, pageWidth],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  }, [pageWidth, scrollX]);

  const syncTypeFromOffset = React.useCallback(
    (offsetX: number) => {
      if (pageWidth <= 0) {
        return;
      }
      const index = Math.round(offsetX / pageWidth);
      const nextType = LISTING_TYPES[Math.min(Math.max(index, 0), LISTING_TYPES.length - 1)];
      setListingType((current) => (current === nextType ? current : nextType));
    },
    [pageWidth],
  );

  const onPagerScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncTypeFromOffset(event.nativeEvent.contentOffset.x);
    },
    [syncTypeFromOffset],
  );

  const onPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0 || width === pageWidth) {
        return;
      }
      setPageWidth(width);
      const index = LISTING_TYPES.indexOf(listingType);
      scrollX.setValue(index * width);
      requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({ x: index * width, animated: false });
      });
    },
    [listingType, pageWidth, scrollX],
  );

  const activeFilterCount = countActiveTripBrowseFilters(filters);

  const tripsByType = React.useMemo(() => {
    const applySharedFilters = (trip: Trip) =>
      matchesQuery(trip, query) && matchesFilters(trip, filters);

    return {
      rfq: trips.filter((trip) => trip.listingType === 'rfq' && applySharedFilters(trip)),
      auction: trips.filter((trip) => trip.listingType === 'auction' && applySharedFilters(trip)),
    };
  }, [trips, query, filters]);

  const renderTypePage = (type: TripListingType, width: number) => {
    const pageTrips = tripsByType[type];
    let pageBody: React.ReactElement;

    if (isScreenLoading) {
      pageBody = (
        <View style={styles.skeletonList}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ListingCardSkeleton key={`home-request-skeleton-${type}-${index}`} />
          ))}
        </View>
      );
    } else if (loadError && trips.length === 0) {
      pageBody = (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{loadError}</AppText>
          <Button
            label={t('dashboard.listings.retry')}
            onPress={() => {
              void loadRequests();
            }}
          />
        </View>
      );
    } else if (trips.length === 0) {
      pageBody = (
        <View style={styles.centered}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.home.requestsEmptyTitle')}
          </AppText>
          <AppText style={styles.emptySubtitle}>{t('dashboard.home.requestsEmptySubtitle')}</AppText>
        </View>
      );
    } else if (pageTrips.length === 0) {
      pageBody = (
        <View style={styles.centered}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.home.listingsFilterEmptyTitle')}
          </AppText>
          <AppText style={styles.emptySubtitle}>
            {t('dashboard.home.listingsFilterEmptySubtitle')}
          </AppText>
        </View>
      );
    } else {
      pageBody = (
        <View style={styles.list}>
          {pageTrips.map((trip) => (
            <ListingCard
              key={trip.id}
              trip={trip}
              showPhotoCount={false}
              onPress={() => navigation.navigate('ListingDetail', { tripId: trip.id })}
            />
          ))}
        </View>
      );
    }

    return (
      <ScrollView
        key={type}
        style={{ width }}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        {pageBody}
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.typeHeader}>
        <SegmentControl
          variant="onBrand"
          options={typeOptions}
          value={listingType}
          onChange={selectListingType}
          animatedIndex={animatedTypeIndex}
        />
      </View>

      <View style={styles.sheet}>
        <View style={styles.searchWrap}>
          <RequestSearchRow
            query={query}
            onChangeQuery={setQuery}
            filterCount={activeFilterCount}
            onFilterPress={() => setFilterSheetVisible(true)}
          />
        </View>

        <View style={styles.pager} onLayout={onPagerLayout}>
          <Animated.ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
            onScrollEndDrag={onPagerScrollEnd}
            onMomentumScrollEnd={onPagerScrollEnd}
            scrollEventThrottle={16}
          >
            {LISTING_TYPES.map((type) => renderTypePage(type, pageWidth))}
          </Animated.ScrollView>
        </View>
      </View>

      <TripFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  typeHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -18,
    overflow: 'hidden',
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  centered: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});
