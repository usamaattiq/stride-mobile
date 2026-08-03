import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { RequestCategoryChips } from './RequestCategoryChips';
import { RequestSearchRow } from './RequestSearchRow';
import { TripFilterSheet } from './TripFilterSheet';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import {
  countActiveTripBrowseFilters,
  EMPTY_TRIP_BROWSE_FILTERS,
  type TripBrowseFilters,
  type TripListingCategory,
} from '../types/tripBrowse.types';

const SKELETON_COUNT = 3;

function matchesCategory(trip: Trip, category: TripListingCategory): boolean {
  if (category === 'all') {
    return true;
  }
  return trip.listingType === category;
}

function matchesQuery(trip: Trip, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = [
    trip.departureCity.label,
    trip.arrivalCity.label,
    trip.vehicleTitle ?? '',
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
  const { trips, loadError, refreshTrips, removeTrip } = useTrips();

  const [isScreenLoading, setIsScreenLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<TripListingCategory>('all');
  const [filters, setFilters] = React.useState<TripBrowseFilters>(EMPTY_TRIP_BROWSE_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
  const [tripToRemove, setTripToRemove] = React.useState<Trip | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setIsScreenLoading(true);
      void refreshTrips()
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) {
            setIsScreenLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [refreshTrips]),
  );

  const activeFilterCount = countActiveTripBrowseFilters(filters);
  const filteredTrips = React.useMemo(
    () =>
      trips.filter(
        (trip) =>
          matchesCategory(trip, category) && matchesQuery(trip, query) && matchesFilters(trip, filters),
      ),
    [trips, category, query, filters],
  );

  const handleConfirmRemove = () => {
    if (!tripToRemove || removing) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    void removeTrip(tripToRemove.id)
      .then(() => setTripToRemove(null))
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('dashboard.listings.remove.failed')));
      })
      .finally(() => setRemoving(false));
  };

  const listHeader = (
    <View style={styles.headerStack}>
      <RequestSearchRow
        query={query}
        onChangeQuery={setQuery}
        filterCount={activeFilterCount}
        onFilterPress={() => setFilterSheetVisible(true)}
      />
      <RequestCategoryChips variant="listing" active={category} onChange={setCategory} />
    </View>
  );

  let body: React.ReactElement;
  if (isScreenLoading) {
    body = (
      <View style={styles.skeletonList}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ListingCardSkeleton key={`home-listing-skeleton-${index}`} />
        ))}
      </View>
    );
  } else if (loadError && trips.length === 0) {
    body = (
      <View style={styles.centered}>
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
      </View>
    );
  } else if (trips.length === 0) {
    body = (
      <View style={styles.centered}>
        <AppText weight="semibold" style={styles.emptyTitle}>
          {t('dashboard.listings.emptyTitle')}
        </AppText>
        <AppText style={styles.emptySubtitle}>{t('dashboard.listings.emptySubtitle')}</AppText>
      </View>
    );
  } else if (filteredTrips.length === 0) {
    body = (
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
    body = (
      <View style={styles.list}>
        {filteredTrips.map((trip) => (
          <ListingCard
            key={trip.id}
            trip={trip}
            showPhotoCount={false}
            onPress={() => navigation.navigate('ListingDetail', { tripId: trip.id })}
            onRemovePress={() => {
              setRemoveError(null);
              setTripToRemove(trip);
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {listHeader}
        {body}
      </ScrollView>

      <TripFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
      />

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
    </>
  );
});

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerStack: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
