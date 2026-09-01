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
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from '../components/DashboardSearchBar';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { ListingsEmptyState } from '../components/ListingsEmptyState';
import { SegmentControl } from '../components/SegmentControl';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import type { TripListingCategory } from '../types/tripBrowse.types';
import { matchesListingCategory, matchesListingQuery } from '../utils/listingFilters';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const SKELETON_COUNT = 4;
const LISTING_CATEGORIES: TripListingCategory[] = ['all', 'rfq', 'auction'];
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - spacing.md * 2;

export function MyOffersScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const isPassenger = user.role === 'passenger';

  const [offers, setOffers] = React.useState<Trip[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [listingCategory, setListingCategory] =
    React.useState<TripListingCategory>('all');
  /** True only until the first load — keep cached offers on later tab focuses. */
  const [isScreenLoading, setIsScreenLoading] = React.useState(true);
  const hasLoadedOnceRef = React.useRef(false);
  const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
  const pagerRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [visitedCategories, setVisitedCategories] = React.useState(
    () => new Set<TripListingCategory>(['all']),
  );

  const typeOptions = React.useMemo(
    () => [
      { id: 'all' as const, label: t('dashboard.home.categoryAllListings') },
      { id: 'rfq' as const, label: t('dashboard.home.categoryRfq') },
      { id: 'auction' as const, label: t('dashboard.home.categoryAuction') },
    ],
    [t],
  );

  const refreshOffers = React.useCallback(async () => {
    setLoadError(null);
    try {
      const list = await tripApi.listMyOffers();
      setOffers(list.map(mapTripDtoToTrip));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('dashboard.offers.loadFailed'));
      throw error;
    }
  }, [t]);

  const { refreshControlProps } = usePullToRefresh(refreshOffers);

  React.useEffect(() => {
    setVisitedCategories((current) => {
      if (current.has(listingCategory)) {
        return current;
      }
      const next = new Set(current);
      next.add(listingCategory);
      return next;
    });
  }, [listingCategory]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) {
        setIsScreenLoading(true);
      }

      const task = InteractionManager.runAfterInteractions(() => {
        void refreshOffers()
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
    }, [refreshOffers]),
  );

  const selectListingCategory = React.useCallback(
    (next: TripListingCategory, animated = true) => {
      setListingCategory(next);
      if (pageWidth <= 0) {
        return;
      }
      const index = LISTING_CATEGORIES.indexOf(next);
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
      inputRange: [0, pageWidth, pageWidth * 2],
      outputRange: [0, 1, 2],
      extrapolate: 'clamp',
    });
  }, [pageWidth, scrollX]);

  const syncCategoryFromOffset = React.useCallback(
    (offsetX: number) => {
      if (pageWidth <= 0) {
        return;
      }
      const index = Math.round(offsetX / pageWidth);
      const nextCategory =
        LISTING_CATEGORIES[Math.min(Math.max(index, 0), LISTING_CATEGORIES.length - 1)];
      setListingCategory((current) => (current === nextCategory ? current : nextCategory));
    },
    [pageWidth],
  );

  const onPagerScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncCategoryFromOffset(event.nativeEvent.contentOffset.x);
    },
    [syncCategoryFromOffset],
  );

  const onPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0 || width === pageWidth) {
        return;
      }
      setPageWidth(width);
      const index = LISTING_CATEGORIES.indexOf(listingCategory);
      scrollX.setValue(index * width);
      requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({ x: index * width, animated: false });
      });
    },
    [listingCategory, pageWidth, scrollX],
  );

  const offersByCategory = React.useMemo(
    () => ({
      all: offers.filter((trip) => matchesListingQuery(trip, query)),
      rfq: offers.filter(
        (trip) => matchesListingCategory(trip, 'rfq') && matchesListingQuery(trip, query),
      ),
      auction: offers.filter(
        (trip) => matchesListingCategory(trip, 'auction') && matchesListingQuery(trip, query),
      ),
    }),
    [offers, query],
  );

  const renderTrip = React.useCallback(
    ({ item }: { item: Trip }) => (
      <ListingCard
        trip={item}
        onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
      />
    ),
    [navigation],
  );

  const renderCategoryPage = (category: TripListingCategory, width: number): React.ReactElement => {
    if (!visitedCategories.has(category)) {
      return <View key={category} style={[styles.page, { width }]} />;
    }

    const pageOffers = offersByCategory[category];
    let pageBody: React.ReactElement;

    if (isScreenLoading && !hasLoadedOnceRef.current) {
      pageBody = (
        <View style={styles.skeletonList}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ListingCardSkeleton key={`offers-skeleton-${category}-${index}`} />
          ))}
        </View>
      );
    } else if (loadError && offers.length === 0) {
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
              void refreshOffers()
                .catch(() => undefined)
                .finally(() => setIsScreenLoading(false));
            }}
          />
        </ScrollView>
      );
    } else if (offers.length === 0) {
      pageBody = (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <ListingsEmptyState
            variant="none"
            title={t('dashboard.offers.emptyTitle')}
            subtitle={t(
              isPassenger
                ? 'dashboard.offers.emptySubtitlePassenger'
                : 'dashboard.offers.emptySubtitleDriver',
            )}
          />
        </ScrollView>
      );
    } else if (pageOffers.length === 0) {
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
          data={pageOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          refreshControl={<RefreshControl {...refreshControlProps} />}
        />
      );
    }

    return (
      <View key={category} style={[styles.page, { width }]}>
        {pageBody}
      </View>
    );
  };

  return (
    <AuthScaffold
      title={t('dashboard.offers.title')}
      subtitle={t(
        isPassenger
          ? 'dashboard.offers.subtitlePassenger'
          : 'dashboard.offers.subtitleDriver',
      )}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      manualTopInset
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
      headerExtra={
        <SegmentControl
          variant="onBrand"
          options={typeOptions}
          value={listingCategory}
          onChange={selectListingCategory}
          animatedIndex={animatedTypeIndex}
        />
      }
    >
      <View style={styles.filters}>
        <DashboardSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('dashboard.listings.searchPlaceholder')}
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
          {LISTING_CATEGORIES.map((category) => renderCategoryPage(category, pageWidth))}
        </Animated.ScrollView>
      </View>
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
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  filters: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge + spacing.md,
  },
  skeletonList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
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
