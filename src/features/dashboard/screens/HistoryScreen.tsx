import React from 'react';
import {
  FlatList,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from '../components/DashboardSearchBar';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { ListingsEmptyState } from '../components/ListingsEmptyState';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import {
  getListingStatusBucket,
  matchesListingQuery,
} from '../utils/listingFilters';

const SKELETON_COUNT = 4;

function isHistoryTrip(trip: Trip, now = Date.now()): boolean {
  const bucket = getListingStatusBucket(trip, now);
  return bucket === 'past' || bucket === 'completed';
}

export function HistoryScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const { trips, loadError, refreshTrips } = useTrips();

  const [query, setQuery] = React.useState('');
  const [isScreenLoading, setIsScreenLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setIsScreenLoading(true);

      const task = InteractionManager.runAfterInteractions(() => {
        void refreshTrips()
          .catch(() => undefined)
          .finally(() => {
            if (!cancelled) {
              setIsScreenLoading(false);
            }
          });
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [refreshTrips]),
  );

  const historyTrips = React.useMemo(() => {
    const now = Date.now();
    return trips.filter(
      (trip) => isHistoryTrip(trip, now) && matchesListingQuery(trip, query),
    );
  }, [trips, query]);

  const historySourceCount = React.useMemo(() => {
    const now = Date.now();
    return trips.filter((trip) => isHistoryTrip(trip, now)).length;
  }, [trips]);

  const renderTrip = React.useCallback(
    ({ item }: { item: Trip }) => (
      <ListingCard
        trip={item}
        onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
      />
    ),
    [navigation],
  );

  let body: React.ReactElement;

  if (isScreenLoading) {
    body = (
      <View style={styles.skeletonList}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ListingCardSkeleton key={`history-skeleton-${index}`} />
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
  } else if (historySourceCount === 0) {
    body = (
      <ListingsEmptyState
        variant="none"
        title={t('dashboard.history.emptyTitle')}
        subtitle={t('dashboard.history.emptySubtitle')}
        icon="history"
      />
    );
  } else if (historyTrips.length === 0) {
    body = <ListingsEmptyState variant="filtered" />;
  } else {
    body = (
      <FlatList
        data={historyTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  return (
    <AuthScaffold
      title={t('dashboard.history.title')}
      subtitle={t('dashboard.history.subtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
    >
      <View style={styles.filters}>
        <DashboardSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('dashboard.listings.searchPlaceholder')}
        />
      </View>
      {body}
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
    marginBottom: spacing.md,
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
