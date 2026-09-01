import React from "react";
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
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { i18n as appI18n } from "@/i18n";
import { getErrorMessage } from "@/services/api/errorMessage";
import { tripApi } from "@/services/api/tripApi";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import {
  resolveSearchQueryCityLabel,
  toBrowseCityParams,
} from "@/shared/utils/localized-city-name";
import { ENV } from "@/shared/config/env";
import { colors, spacing } from "@/theme";

import { ListingCard } from "./ListingCard";
import { ListingCardSkeleton } from "./ListingCardSkeleton";
import { RequestSearchRow } from "./RequestSearchRow";
import { RouteTypeFilterChips } from "./RouteTypeFilterChips";
import { SegmentControl } from "./SegmentControl";
import { TripFilterSheet } from "./TripFilterSheet";
import type { DashboardRootStackParamList } from "../navigation/dashboardRootTypes";
import type { Trip, TripRouteType } from "../types/trip.types";
import {
  countActiveTripBrowseFilters,
  EMPTY_TRIP_BROWSE_FILTERS,
  type TripBrowseFilters,
  type TripListingCategory,
} from "../types/tripBrowse.types";
import { mapTripDtoToTrip } from "../utils/trip.mapper";

const SKELETON_COUNT = 3;
const LISTING_CATEGORIES: TripListingCategory[] = ["all", "rfq", "auction"];
const PAGE_SIZE = 20;
const END_REACHED_THRESHOLD_PX = 200;
const INITIAL_PAGE_WIDTH = Dimensions.get("window").width - spacing.md * 2;

type CategoryState = {
  trips: Trip[];
  page: number;
  totalPages: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  hasLoadedOnce: boolean;
};

function createCategoryState(): CategoryState {
  return {
    trips: [],
    page: 1,
    totalPages: 0,
    isLoading: true,
    isLoadingMore: false,
    loadError: null,
    hasLoadedOnce: false,
  };
}

function createInitialCategoryData(): Record<TripListingCategory, CategoryState> {
  return {
    all: createCategoryState(),
    rfq: createCategoryState(),
    auction: createCategoryState(),
  };
}

export const DriverListingsPanel = React.memo(
  function DriverListingsPanel(): React.ReactElement {
    const { t } = useTranslation(undefined, { i18n: appI18n });
    const navigation =
      useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();

    const [query, setQuery] = React.useState("");
    const [debouncedQuery, setDebouncedQuery] = React.useState("");
    // Trip city labels are stored in whichever single language the creator's
    // app was in — a literal backend search can't match a query typed in a
    // different script (e.g. Arabic vs. an English-stored "Lahore"). Resolve
    // the query to its English city equivalent via geocoding before sending
    // it; falls back to the raw text when it isn't a place name.
    const [resolvedQuery, setResolvedQuery] = React.useState("");
    const [listingCategory, setListingCategory] =
      React.useState<TripListingCategory>("all");
    const [filters, setFilters] = React.useState<TripBrowseFilters>(
      EMPTY_TRIP_BROWSE_FILTERS,
    );
    const [routeType, setRouteType] = React.useState<TripRouteType | null>(
      null,
    );
    const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
    const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
    const pagerRef = React.useRef<ScrollView>(null);
    const scrollX = React.useRef(new Animated.Value(0)).current;
    const [visitedCategories, setVisitedCategories] = React.useState(
      () => new Set<TripListingCategory>(["all"]),
    );
    const [categoryData, setCategoryData] = React.useState(
      createInitialCategoryData,
    );
    const categoryDataRef = React.useRef(categoryData);
    const visitedCategoriesRef = React.useRef(visitedCategories);
    const paramsRef = React.useRef({ resolvedQuery, filters, routeType });

    React.useEffect(() => {
      categoryDataRef.current = categoryData;
    }, [categoryData]);

    React.useEffect(() => {
      visitedCategoriesRef.current = visitedCategories;
    }, [visitedCategories]);

    React.useEffect(() => {
      paramsRef.current = { resolvedQuery, filters, routeType };
    }, [resolvedQuery, filters, routeType]);

    React.useEffect(() => {
      const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
      return () => clearTimeout(timer);
    }, [query]);

    React.useEffect(() => {
      if (!debouncedQuery) {
        setResolvedQuery("");
        return;
      }
      let cancelled = false;
      void resolveSearchQueryCityLabel(debouncedQuery, ENV.googleMapsApiKey).then(
        (cityLabel) => {
          if (!cancelled) {
            setResolvedQuery(cityLabel || debouncedQuery);
          }
        },
      );
      return () => {
        cancelled = true;
      };
    }, [debouncedQuery]);

    const typeOptions = React.useMemo(
      () => [
        { id: "all" as const, label: t("dashboard.home.categoryAllListings") },
        { id: "rfq" as const, label: t("dashboard.home.categoryRfq") },
        { id: "auction" as const, label: t("dashboard.home.categoryAuction") },
      ],
      [t],
    );

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

    // Stable identity: reads current search/filter/route params from a ref so
    // it doesn't need to change (and re-trigger effects) whenever they do.
    const loadCategoryPage = React.useCallback(
      async (
        category: TripListingCategory,
        page: number,
        mode: "replace" | "append" = "replace",
      ) => {
        const { resolvedQuery, filters, routeType } = paramsRef.current;
        setCategoryData((current) => ({
          ...current,
          [category]: {
            ...current[category],
            isLoading: mode === "replace",
            isLoadingMore: mode === "append",
            loadError: null,
          },
        }));
        try {
          const [departure, arrival] = await Promise.all([
            toBrowseCityParams(filters.departureCity, ENV.googleMapsApiKey),
            toBrowseCityParams(filters.arrivalCity, ENV.googleMapsApiKey),
          ]);
          const result = await tripApi.browse({
            kind: "requests",
            q: resolvedQuery || undefined,
            listingType: category === "all" ? undefined : category,
            paymentMethod: filters.paymentMethod ?? undefined,
            departureCity: departure.label,
            departureCityId: departure.id,
            arrivalCity: arrival.label,
            arrivalCityId: arrival.id,
            vehicleMode: filters.vehicleMode ?? undefined,
            minSeats: filters.minSeats ?? undefined,
            page,
            limit: PAGE_SIZE,
          });
          const mapped = result.items
            .map(mapTripDtoToTrip)
            .filter((trip) => routeType === null || trip.routeType === routeType);
          setCategoryData((current) => ({
            ...current,
            [category]: {
              trips:
                mode === "append"
                  ? [...current[category].trips, ...mapped]
                  : mapped,
              page,
              totalPages: result.totalPages,
              isLoading: false,
              isLoadingMore: false,
              loadError: null,
              hasLoadedOnce: true,
            },
          }));
        } catch (error) {
          setCategoryData((current) => ({
            ...current,
            [category]: {
              ...current[category],
              trips: mode === "append" ? current[category].trips : [],
              isLoading: false,
              isLoadingMore: false,
              loadError: getErrorMessage(
                error,
                t("dashboard.home.requestsLoadFailed"),
              ),
              hasLoadedOnce: true,
            },
          }));
        }
      },
      [t],
    );

    const loadMoreCategory = React.useCallback(
      (category: TripListingCategory) => {
        const state = categoryDataRef.current[category];
        if (
          state.isLoading ||
          state.isLoadingMore ||
          state.page >= state.totalPages
        ) {
          return;
        }
        void loadCategoryPage(category, state.page + 1, "append");
      },
      [loadCategoryPage],
    );

    // Search/filter/route-type changes: reset every visited category back to
    // page 1 and refetch it with the new params.
    React.useEffect(() => {
      setCategoryData((current) => {
        const next = { ...current };
        for (const category of LISTING_CATEGORIES) {
          next[category] = {
            ...createCategoryState(),
            isLoading: visitedCategoriesRef.current.has(category),
          };
        }
        return next;
      });
      for (const category of visitedCategoriesRef.current) {
        void loadCategoryPage(category, 1);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedQuery, filters, routeType, loadCategoryPage]);

    // Newly-visited tab: fetch its first page immediately.
    const prevVisitedRef = React.useRef(visitedCategories);
    React.useEffect(() => {
      for (const category of visitedCategories) {
        if (!prevVisitedRef.current.has(category)) {
          void loadCategoryPage(category, 1);
        }
      }
      prevVisitedRef.current = visitedCategories;
    }, [visitedCategories, loadCategoryPage]);

    // Screen focus: refetch whatever's currently visited at its current page.
    useFocusEffect(
      React.useCallback(() => {
        for (const category of visitedCategoriesRef.current) {
          void loadCategoryPage(
            category,
            categoryDataRef.current[category].page,
          );
        }
      }, [loadCategoryPage]),
    );

    const loadVisitedCategories = React.useCallback(async () => {
      await Promise.all(
        [...visitedCategoriesRef.current].map((category) =>
          loadCategoryPage(category, 1),
        ),
      );
    }, [loadCategoryPage]);

    const { refreshControlProps } = usePullToRefresh(loadVisitedCategories);

    const onCategoryScroll = React.useCallback(
      (
        category: TripListingCategory,
        event: NativeSyntheticEvent<NativeScrollEvent>,
      ) => {
        const { contentOffset, layoutMeasurement, contentSize } =
          event.nativeEvent;
        const distanceFromBottom =
          contentSize.height - layoutMeasurement.height - contentOffset.y;
        if (distanceFromBottom <= END_REACHED_THRESHOLD_PX) {
          loadMoreCategory(category);
        }
      },
      [loadMoreCategory],
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
        extrapolate: "clamp",
      });
    }, [pageWidth, scrollX]);

    const syncCategoryFromOffset = React.useCallback(
      (offsetX: number) => {
        if (pageWidth <= 0) {
          return;
        }
        const index = Math.round(offsetX / pageWidth);
        const nextCategory =
          LISTING_CATEGORIES[
            Math.min(Math.max(index, 0), LISTING_CATEGORIES.length - 1)
          ];
        setListingCategory((current) =>
          current === nextCategory ? current : nextCategory,
        );
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

    const activeFilterCount = countActiveTripBrowseFilters(filters);

    const renderCategoryPage = (
      category: TripListingCategory,
      width: number,
    ) => {
      if (!visitedCategories.has(category)) {
        return <View key={category} style={[styles.page, { width }]} />;
      }

      const state = categoryData[category];
      let pageBody: React.ReactElement;

      if (state.isLoading && !state.hasLoadedOnce) {
        pageBody = (
          <View style={styles.skeletonList}>
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <ListingCardSkeleton
                key={`home-request-skeleton-${category}-${index}`}
              />
            ))}
          </View>
        );
      } else if (state.loadError && state.trips.length === 0) {
        pageBody = (
          <View style={styles.centered}>
            <AppText style={styles.errorText}>{state.loadError}</AppText>
            <Button
              label={t("dashboard.listings.retry")}
              onPress={() => {
                void loadCategoryPage(category, state.page);
              }}
            />
          </View>
        );
      } else if (state.trips.length === 0) {
        pageBody = (
          <EmptyState
            title={t("dashboard.home.requestsEmptyTitle")}
            subtitle={t("dashboard.home.requestsEmptySubtitle")}
          />
        );
      } else {
        pageBody = (
          <View style={styles.list}>
            {state.trips.map((trip) => (
              <ListingCard
                key={trip.id}
                trip={trip}
                showPhotoCount={false}
                onPress={() =>
                  navigation.navigate("ListingDetail", { tripId: trip.id })
                }
              />
            ))}
            {state.isLoadingMore && (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </View>
        );
      }

      return (
        <ScrollView
          key={category}
          style={{ width }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          onScroll={(event) => onCategoryScroll(category, event)}
          scrollEventThrottle={100}
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
            value={listingCategory}
            onChange={selectListingCategory}
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

          <View style={styles.routeChipsWrap}>
            <RouteTypeFilterChips value={routeType} onChange={setRouteType} />
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
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                  useNativeDriver: true,
                },
              )}
              onScrollEndDrag={onPagerScrollEnd}
              onMomentumScrollEnd={onPagerScrollEnd}
              scrollEventThrottle={16}
            >
              {LISTING_CATEGORIES.map((category) =>
                renderCategoryPage(category, pageWidth),
              )}
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
  },
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  typeHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    // Same brand clearance as HomeScreen panelHeader under titles.
    paddingBottom: spacing.xxl,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -18,
    overflow: "hidden",
  },
  page: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  routeChipsWrap: {
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
  },
  pager: {
    flex: 1,
    overflow: "hidden",
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  loadMoreIndicator: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  centered: {
    gap: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
  },
});
