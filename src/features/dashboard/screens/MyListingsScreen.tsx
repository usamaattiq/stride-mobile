import React from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  InteractionManager,
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

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from '../components/DashboardSearchBar';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { ListingStatusChips } from '../components/ListingStatusChips';
import { ListingsEmptyState } from '../components/ListingsEmptyState';
import { SegmentControl } from '../components/SegmentControl';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip, TripListingType } from '../types/trip.types';
import {
  matchesListingQuery,
  matchesListingStatus,
  matchesListingType,
  type ListingStatusFilter,
} from '../utils/listingFilters';

const SKELETON_COUNT = 4;
const LISTING_TYPES: TripListingType[] = ['rfq', 'auction'];
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - spacing.md * 2;

export function MyListingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const { trips, loadError, refreshTrips, removeTrip } = useTrips();
  const { refreshControlProps } = usePullToRefresh(refreshTrips);

  const [listingType, setListingType] = React.useState<TripListingType>('rfq');
  const [statusFilter, setStatusFilter] = React.useState<ListingStatusFilter>('all');
  const [query, setQuery] = React.useState('');
  const [tripToRemove, setTripToRemove] = React.useState<Trip | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  /** True only until the first successful/failed load — keep cached list on later tab focuses. */
  const [isScreenLoading, setIsScreenLoading] = React.useState(true);
  const hasLoadedOnceRef = React.useRef(false);
  const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
  const pagerRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [visitedTypes, setVisitedTypes] = React.useState(
    () => new Set<TripListingType>(['rfq']),
  );

  const typeOptions = React.useMemo(
    () => [
      { id: 'rfq' as const, label: t('dashboard.home.categoryRfq') },
      { id: 'auction' as const, label: t('dashboard.home.categoryAuction') },
    ],
    [t],
  );

  React.useEffect(() => {
    setVisitedTypes((current) => {
      if (current.has(listingType)) {
        return current;
      }
      const next = new Set(current);
      next.add(listingType);
      return next;
    });
  }, [listingType]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) {
        setIsScreenLoading(true);
      }

      const task = InteractionManager.runAfterInteractions(() => {
        void refreshTrips()
          .catch(() => undefined)
          .finally(() => {
            if (cancelled) {
              return;
            }
            hasLoadedOnceRef.current = true;
            setIsScreenLoading(false);
          });
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [refreshTrips]),
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

  const tripsByType = React.useMemo(() => {
    const applySharedFilters = (trip: Trip) =>
      matchesListingStatus(trip, statusFilter) && matchesListingQuery(trip, query);

    return {
      rfq: trips.filter((trip) => matchesListingType(trip, 'rfq') && applySharedFilters(trip)),
      auction: trips.filter(
        (trip) => matchesListingType(trip, 'auction') && applySharedFilters(trip),
      ),
    };
  }, [trips, statusFilter, query]);

  const handleConfirmRemove = () => {
    if (!tripToRemove || removing) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    void removeTrip(tripToRemove.id)
      .then(() => {
        setTripToRemove(null);
      })
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('dashboard.listings.remove.failed')));
      })
      .finally(() => {
        setRemoving(false);
      });
  };

  const renderTrip = React.useCallback(
    ({ item }: { item: Trip }) => (
      <ListingCard
        trip={item}
        showPhotoCount={false}
        onPress={() => {
          navigation.navigate('ListingDetail', { tripId: item.id });
        }}
        onRemovePress={() => {
          setRemoveError(null);
          setTripToRemove(item);
        }}
      />
    ),
    [navigation],
  );

  const filtersHeader = (
    <View style={styles.filters}>
      <ListingStatusChips active={statusFilter} onChange={setStatusFilter} />
      <DashboardSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('dashboard.listings.searchPlaceholder')}
      />
    </View>
  );

  const renderTypePage = (type: TripListingType, width: number) => {
    if (!visitedTypes.has(type)) {
      return <View key={type} style={[styles.page, { width }]} />;
    }

    const pageTrips = tripsByType[type];
    let pageBody: React.ReactElement;

    if (isScreenLoading && !hasLoadedOnceRef.current) {
      pageBody = (
        <View style={styles.skeletonList}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ListingCardSkeleton key={`listing-skeleton-${type}-${index}`} />
          ))}
        </View>
      );
    } else if (loadError && trips.length === 0) {
      pageBody = (
        <ScrollView
          contentContainerStyle={styles.centered}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <AppText style={styles.errorText}>{loadError}</AppText>
          <Button
            label={t('dashboard.listings.retry')}
            onPress={() => {
              setIsScreenLoading(true);
              void refreshTrips()
                .catch(() => undefined)
                .finally(() => setIsScreenLoading(false));
            }}
          />
        </ScrollView>
      );
    } else if (trips.length === 0) {
      pageBody = (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <ListingsEmptyState variant="none" />
        </ScrollView>
      );
    } else if (pageTrips.length === 0) {
      pageBody = (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <ListingsEmptyState variant="filtered" />
        </ScrollView>
      );
    } else {
      pageBody = (
        <FlatList
          data={pageTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          updateCellsBatchingPeriod={50}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl {...refreshControlProps} />}
        />
      );
    }

    return (
      <View key={type} style={[styles.page, { width }]}>
        {pageBody}
      </View>
    );
  };

  return (
    <AuthScaffold
      title={t('dashboard.listings.title')}
      subtitle={t('dashboard.listings.subtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
      headerExtra={
        <SegmentControl
          variant="onBrand"
          options={typeOptions}
          value={listingType}
          onChange={selectListingType}
          animatedIndex={animatedTypeIndex}
        />
      }
    >
      {filtersHeader}
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

      <AppDialog
        visible={tripToRemove !== null}
        icon="trash"
        title={t('dashboard.listings.remove.title')}
        message={
          removeError ??
          (tripToRemove
            ? t('dashboard.listings.remove.confirm', {
                from: cityDisplayName(tripToRemove.departureCity.label),
                to: cityDisplayName(tripToRemove.arrivalCity.label),
              })
            : undefined)
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (removing) {
              return;
            }
            setTripToRemove(null);
            setRemoveError(null);
          },
        }}
        confirmAction={{
          label: t('dashboard.listings.remove.confirmAction'),
          onPress: handleConfirmRemove,
        }}
      />
    </AuthScaffold>
  );
}

function ListSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
  },
  filters: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
  page: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge + spacing.md,
  },
  skeletonList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    flexGrow: 1,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});









