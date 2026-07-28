import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { TripCity, TripVehicleMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { ENV } from '@/shared/config/env';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { searchCities } from '@/shared/utils/city-search';
import { colors, getFontFamily, radius, spacing } from '@/theme';

import { FeedPaginationBar } from './FeedPaginationBar';
import { ListingCard } from './ListingCard';
import { RequestsEmptyState } from './RequestsEmptyState';
import { isSameLocalDay, startOfLocalDay } from './trip/dateRangeUtils';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

const PAGE_SIZE = 5;
const MIN_PASSENGERS = 1;
const MAX_PASSENGERS = 50;
const CITY_RESULT_ROW_HEIGHT = 48;
const CITY_RESULTS_MAX_HEIGHT = CITY_RESULT_ROW_HEIGHT * 3;

type QuickDate = 'today' | 'tomorrow' | 'custom';

function addDays(base: Date, days: number): Date {
  const next = startOfLocalDay(base);
  next.setDate(next.getDate() + days);
  return next;
}

function formatSearchDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function resolveQuickDate(date: Date, today: Date): QuickDate {
  if (isSameLocalDay(date, today)) {
    return 'today';
  }
  if (isSameLocalDay(date, addDays(today, 1))) {
    return 'tomorrow';
  }
  return 'custom';
}

export const PassengerSearchPanel = React.memo(function PassengerSearchPanel(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();

  const [vehicleMode, setVehicleMode] = React.useState<TripVehicleMode>('shared');
  const [departureCity, setDepartureCity] = React.useState<TripCity | null>(null);
  const [arrivalCity, setArrivalCity] = React.useState<TripCity | null>(null);
  const [departureDate, setDepartureDate] = React.useState(() => startOfLocalDay(new Date()));
  const [passengerCount, setPassengerCount] = React.useState(1);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const [applied, setApplied] = React.useState({
    vehicleMode: 'shared' as TripVehicleMode,
    departureCity: null as TripCity | null,
    arrivalCity: null as TripCity | null,
    departureDate: null as Date | null,
    passengerCount: null as number | null,
  });
  const [hasSearched, setHasSearched] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const today = startOfLocalDay(new Date());
  const quickDate = resolveQuickDate(departureDate, today);

  const loadTrips = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await tripApi.browse({
        departureCityId: applied.departureCity?.id,
        arrivalCityId: applied.arrivalCity?.id,
        vehicleMode: hasSearched ? applied.vehicleMode : undefined,
        minSeats: applied.passengerCount ?? undefined,
        page: 1,
        limit: 100,
      });

      const mapped = result.items.map(mapTripDtoToTrip);
      const dayFiltered =
        applied.departureDate == null
          ? mapped
          : mapped.filter((trip) =>
              isSameLocalDay(new Date(trip.departureAt), applied.departureDate!),
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
  }, [applied, hasSearched, page]);

  useFocusEffect(
    React.useCallback(() => {
      void loadTrips();
    }, [loadTrips]),
  );

  React.useEffect(() => {
    setPage(1);
  }, [applied, hasSearched]);

  const handleSearch = () => {
    setApplied({
      vehicleMode,
      departureCity,
      arrivalCity,
      departureDate: startOfLocalDay(departureDate),
      passengerCount,
    });
    setHasSearched(true);
    setPage(1);
  };

  const handleSwapCities = () => {
    setDepartureCity(arrivalCity);
    setArrivalCity(departureCity);
  };

  const handleDatePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    setDepartureDate(startOfLocalDay(selected));
  };

  const listHeader = (
    <View style={styles.resultsHeader}>
      <FeedPaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </View>
  );

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar style="light" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <View style={styles.titleRow}>
          <AppText weight="bold" style={styles.title}>
            {t('dashboard.listings.searchTitle')}
          </AppText>
        </View>

        <View style={styles.segment}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: vehicleMode === 'shared' }}
            onPress={() => setVehicleMode('shared')}
            style={[styles.segmentItem, vehicleMode === 'shared' && styles.segmentItemActive]}
          >
            <AppText
              weight="semibold"
              style={[
                styles.segmentLabel,
                vehicleMode === 'shared' ? styles.segmentLabelActive : styles.segmentLabelIdle,
              ]}
            >
              {t('dashboard.search.shared')}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: vehicleMode === 'fullPrivate' }}
            onPress={() => setVehicleMode('fullPrivate')}
            style={[styles.segmentItem, vehicleMode === 'fullPrivate' && styles.segmentItemActive]}
          >
            <AppText
              weight="semibold"
              style={[
                styles.segmentLabel,
                vehicleMode === 'fullPrivate' ? styles.segmentLabelActive : styles.segmentLabelIdle,
              ]}
            >
              {t('dashboard.search.private')}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.routeBlock}>
          <SearchCityField
            icon="arrow-up"
            placeholder={t('dashboard.search.departure')}
            value={departureCity}
            onChange={setDepartureCity}
            language={currentLanguage}
            inputStyle={styles.routeCityInput}
          />
          <SearchCityField
            icon="arrow-down"
            placeholder={t('dashboard.search.arrival')}
            value={arrivalCity}
            onChange={setArrivalCity}
            language={currentLanguage}
            inputStyle={styles.routeCityInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.search.swapCities')}
            onPress={handleSwapCities}
            style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}
          >
            <FontAwesome name="exchange" size={14} color={colors.white} style={styles.swapIcon} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [styles.dateMainPress, pressed && styles.pressed]}
          >
            <FontAwesome name="calendar" size={14} color={colors.white} />
            <AppText weight="semibold" style={styles.fieldValue}>
              {formatSearchDate(departureDate, i18n.language)}
            </AppText>
          </Pressable>
          <View style={styles.quickDateRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDepartureDate(today)}
              hitSlop={6}
            >
              <AppText
                weight="semibold"
                style={[
                  styles.quickDate,
                  quickDate === 'today' ? styles.quickDateActive : styles.quickDateIdle,
                ]}
              >
                {t('dashboard.search.today')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDepartureDate(addDays(today, 1))}
              hitSlop={6}
            >
              <AppText
                weight="semibold"
                style={[
                  styles.quickDate,
                  quickDate === 'tomorrow' ? styles.quickDateActive : styles.quickDateIdle,
                ]}
              >
                {t('dashboard.search.tomorrow')}
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.field, styles.passengerField]}>
            <FontAwesome name="user" size={14} color={colors.white} />
            <AppText weight="semibold" style={styles.passengerLabel} numberOfLines={1}>
              {t('dashboard.search.passengerCount')}
            </AppText>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.search.decreasePassengers')}
                disabled={passengerCount <= MIN_PASSENGERS}
                onPress={() => setPassengerCount((count) => Math.max(MIN_PASSENGERS, count - 1))}
                style={({ pressed }) => [
                  styles.stepperButton,
                  passengerCount <= MIN_PASSENGERS && styles.stepperButtonDisabled,
                  pressed && passengerCount > MIN_PASSENGERS && styles.pressed,
                ]}
              >
                <FontAwesome
                  name="minus"
                  size={12}
                  color={passengerCount <= MIN_PASSENGERS ? colors.text.onBrandMuted : colors.white}
                />
              </Pressable>
              <AppText weight="bold" style={styles.stepperValue}>
                {passengerCount}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.search.increasePassengers')}
                disabled={passengerCount >= MAX_PASSENGERS}
                onPress={() => setPassengerCount((count) => Math.min(MAX_PASSENGERS, count + 1))}
                style={({ pressed }) => [
                  styles.stepperButton,
                  passengerCount >= MAX_PASSENGERS && styles.stepperButtonDisabled,
                  pressed && passengerCount < MAX_PASSENGERS && styles.pressed,
                ]}
              >
                <FontAwesome
                  name="plus"
                  size={12}
                  color={passengerCount >= MAX_PASSENGERS ? colors.text.onBrandMuted : colors.white}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.search.searchAction')}
            onPress={handleSearch}
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
          >
            <FontAwesome name="search" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.resultsCard}>
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              trip={item}
              onPress={() => navigation.navigate('ListingDetail', { tripId: item.id })}
            />
          )}
          ListHeaderComponent={totalPages > 1 ? listHeader : null}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {showDatePicker ? (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.dateModalBackdrop} onPress={() => setShowDatePicker(false)}>
              <Pressable style={styles.dateModalCard} onPress={() => undefined}>
                <DateTimePicker
                  value={departureDate}
                  mode="date"
                  minimumDate={today}
                  onChange={handleDatePickerChange}
                  display="spinner"
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowDatePicker(false)}
                  style={styles.dateModalDone}
                >
                  <AppText weight="bold" style={styles.dateModalDoneText}>
                    {t('common.done')}
                  </AppText>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={departureDate}
            mode="date"
            minimumDate={today}
            onChange={handleDatePickerChange}
            display="default"
          />
        )
      ) : null}
    </View>
  );
});

type SearchCityFieldProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  placeholder: string;
  value: TripCity | null;
  onChange: (city: TripCity | null) => void;
  language: string;
  inputStyle?: StyleProp<ViewStyle>;
};

function SearchCityField({
  icon,
  placeholder,
  value,
  onChange,
  language,
  inputStyle,
}: SearchCityFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [query, setQuery] = React.useState(value?.label ?? '');
  const [results, setResults] = React.useState<TripCity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const skipSearchRef = React.useRef(false);

  React.useEffect(() => {
    if (isFocused) {
      return;
    }
    setQuery(value?.label ?? '');
  }, [isFocused, value?.label]);

  React.useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!isFocused) {
      setResults([]);
      setShowEmpty(false);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShowEmpty(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setShowEmpty(false);
      void searchCities(trimmed, ENV.googleMapsApiKey)
        .then((items) => {
          setResults(items);
          setShowEmpty(items.length === 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [isFocused, query]);

  const handleSelect = (city: TripCity) => {
    const selected = { ...city, label: cityDisplayName(city.label) };
    skipSearchRef.current = true;
    setQuery(selected.label);
    setResults([]);
    setShowEmpty(false);
    setIsFocused(false);
    onChange(selected);
  };

  return (
    <View style={styles.cityFieldWrap}>
      <View style={[styles.field, inputStyle]}>
        <FontAwesome name={icon} size={13} color={colors.white} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (value) {
              onChange(null);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setResults([]);
            setShowEmpty(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.onBrandMuted}
          style={[styles.cityInput, { fontFamily: getFontFamily(language, 'semibold') }]}
        />
        {loading ? <ActivityIndicator size="small" color={colors.white} /> : null}
      </View>

      {results.length > 0 ? (
        <View style={styles.cityResults}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={results.length > 3}
            style={styles.cityResultsScroll}
          >
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelect(item)}
                style={styles.cityResultRow}
                accessibilityRole="button"
              >
                <AppText style={styles.cityResultText} numberOfLines={2}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {!loading && showEmpty ? (
        <AppText style={styles.cityHint}>{t('trips.create.cityNoResults')}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    lineHeight: 26,
  },
  segment: {
    alignSelf: 'flex-start',
    width: '50%',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: radius.full,
    overflow: 'hidden',
    minHeight: 42,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  segmentItemActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  segmentLabel: {
    fontSize: 14,
  },
  segmentLabelActive: {
    color: colors.white,
  },
  segmentLabelIdle: {
    color: colors.text.onBrandMuted,
  },
  routeBlock: {
    position: 'relative',
    gap: spacing.xs,
    zIndex: 4,
  },
  routeCityInput: {
    paddingRight: 52,
  },
  swapButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryPressed,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  swapIcon: {
    transform: [{ rotate: '90deg' }],
  },
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickDate: {
    fontSize: 13,
  },
  quickDateActive: {
    color: colors.white,
  },
  quickDateIdle: {
    color: colors.text.onBrandMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  passengerField: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  passengerLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.45,
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    color: colors.white,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.xs,
    overflow: 'hidden',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultsHeader: {
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
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
  cityFieldWrap: {
    zIndex: 1,
  },
  cityInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    paddingVertical: spacing.xs,
  },
  cityResults: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
    maxHeight: CITY_RESULTS_MAX_HEIGHT,
    zIndex: 30,
    elevation: 8,
  },
  cityResultsScroll: {
    maxHeight: CITY_RESULTS_MAX_HEIGHT,
  },
  cityResultRow: {
    minHeight: CITY_RESULT_ROW_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  cityResultText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  cityHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.text.onBrandMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dateModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  dateModalDone: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dateModalDoneText: {
    color: colors.primary,
    fontSize: 16,
  },
});
