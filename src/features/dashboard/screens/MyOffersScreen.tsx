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
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from '../components/DashboardSearchBar';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { ListingsEmptyState } from '../components/ListingsEmptyState';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { matchesListingQuery } from '../utils/listingFilters';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const SKELETON_COUNT = 4;

export function MyOffersScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const isPassenger = user.role === 'passenger';

  const [offers, setOffers] = React.useState<Trip[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [isScreenLoading, setIsScreenLoading] = React.useState(true);

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

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setIsScreenLoading(true);

      const task = InteractionManager.runAfterInteractions(() => {
        void refreshOffers()
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
    }, [refreshOffers]),
  );

  const filteredOffers = React.useMemo(
    () => offers.filter((trip) => matchesListingQuery(trip, query)),
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

  let body: React.ReactElement;

  if (isScreenLoading) {
    body = (
      <View style={styles.skeletonList}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ListingCardSkeleton key={`offers-skeleton-${index}`} />
        ))}
      </View>
    );
  } else if (loadError && offers.length === 0) {
    body = (
      <View style={styles.centered}>
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
      </View>
    );
  } else if (offers.length === 0) {
    body = (
      <ListingsEmptyState
        variant="none"
        title={t('dashboard.offers.emptyTitle')}
        subtitle={t(
          isPassenger
            ? 'dashboard.offers.emptySubtitlePassenger'
            : 'dashboard.offers.emptySubtitleDriver',
        )}
        icon="tag"
      />
    );
  } else if (filteredOffers.length === 0) {
    body = <ListingsEmptyState variant="filtered" />;
  } else {
    body = (
      <FlatList
        data={filteredOffers}
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
      title={t('dashboard.offers.title')}
      subtitle={t(
        isPassenger
          ? 'dashboard.offers.subtitlePassenger'
          : 'dashboard.offers.subtitleDriver',
      )}
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
