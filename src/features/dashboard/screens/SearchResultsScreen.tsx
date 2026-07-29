import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { FeedPaginationBar } from '../components/FeedPaginationBar';
import { ListingCard } from '../components/ListingCard';
import { RequestsEmptyState } from '../components/RequestsEmptyState';
import { SearchRouteMap } from '../components/SearchRouteMap';
import { isSameLocalDay } from '../components/trip/dateRangeUtils';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const PAGE_SIZE = 5;

export function SearchResultsScreen(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
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

  const fromLabel = cityDisplayName(departureCity.label);
  const toLabel = cityDisplayName(arrivalCity.label);
  const dateLabel = departureDate.toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const routeTitle = `${fromLabel} → ${toLabel}`;

  const loadTrips = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await tripApi.browse({
        departureCityId: departureCity.id,
        arrivalCityId: arrivalCity.id,
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

  const listHeader = (
    <View>
      <SearchRouteMap departureLabel={fromLabel} arrivalLabel={toLabel} />
      <View style={styles.metaRow}>
        <AppText style={styles.routeMeta}>
          {t('dashboard.search.results.summary', {
            date: dateLabel,
            count: passengerCount,
          })}
        </AppText>
        {totalPages > 1 ? (
          <FeedPaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </View>
    </View>
  );

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={routeTitle}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
      titleStyle={styles.headerTitle}
    >
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
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
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
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    maxWidth: '100%',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  routeMeta: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  cardPad: {
    paddingHorizontal: spacing.md,
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
