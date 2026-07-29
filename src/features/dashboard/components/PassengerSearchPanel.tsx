import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import type { TripCity, TripVehicleMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { SearchCityPickerModal } from './SearchCityPickerModal';
import { SegmentControl } from './SegmentControl';
import { isSameLocalDay, startOfLocalDay } from './trip/dateRangeUtils';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';

const MIN_PASSENGERS = 1;
const MAX_PASSENGERS = 50;

type QuickDate = 'today' | 'tomorrow' | 'custom';
type CityPickerMode = 'departure' | 'arrival' | null;

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
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();

  const [vehicleMode, setVehicleMode] = React.useState<TripVehicleMode>('shared');
  const [departureCity, setDepartureCity] = React.useState<TripCity | null>(null);
  const [arrivalCity, setArrivalCity] = React.useState<TripCity | null>(null);
  const [departureDate, setDepartureDate] = React.useState(() => startOfLocalDay(new Date()));
  const [passengerCount, setPassengerCount] = React.useState(1);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [cityPickerMode, setCityPickerMode] = React.useState<CityPickerMode>(null);
  const [departureError, setDepartureError] = React.useState<string | null>(null);
  const [arrivalError, setArrivalError] = React.useState<string | null>(null);

  const today = startOfLocalDay(new Date());
  const quickDate = resolveQuickDate(departureDate, today);

  const vehicleModeOptions = React.useMemo(
    () => [
      { id: 'shared' as const, label: t('dashboard.search.shared') },
      { id: 'fullPrivate' as const, label: t('dashboard.search.private') },
    ],
    [t],
  );

  const handleSearch = () => {
    let hasError = false;
    if (!departureCity) {
      setDepartureError(t('dashboard.search.chooseDeparture'));
      hasError = true;
    } else {
      setDepartureError(null);
    }
    if (!arrivalCity) {
      setArrivalError(
        departureCity
          ? t('dashboard.search.chooseArrival')
          : t('dashboard.search.chooseDepartureFirst'),
      );
      hasError = true;
    } else if (!hasError) {
      setArrivalError(null);
    }
    if (hasError || !departureCity || !arrivalCity) {
      return;
    }

    navigation.navigate('SearchResults', {
      departureCity,
      arrivalCity,
      departureDateISO: startOfLocalDay(departureDate).toISOString(),
      vehicleMode,
      passengerCount,
    });
  };

  const handleSwapCities = () => {
    setDepartureError(null);
    setArrivalError(null);
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

  const handleCityPickerClose = React.useCallback(() => {
    setCityPickerMode(null);
  }, []);

  const openArrivalPicker = React.useCallback(() => {
    if (!departureCity) {
      setArrivalError(t('dashboard.search.chooseDepartureFirst'));
      return;
    }
    setArrivalError(null);
    setCityPickerMode('arrival');
  }, [departureCity, t]);

  const cityPickerModeRef = React.useRef(cityPickerMode);
  cityPickerModeRef.current = cityPickerMode;
  const departureCityRef = React.useRef(departureCity);
  departureCityRef.current = departureCity;
  const arrivalCityRef = React.useRef(arrivalCity);
  arrivalCityRef.current = arrivalCity;

  const handleCityPickerSelect = React.useCallback((city: TripCity) => {
    if (cityPickerModeRef.current === 'arrival') {
      if (departureCityRef.current?.id === city.id) {
        setArrivalError(t('dashboard.search.sameCityNotAllowed'));
        return;
      }
      setArrivalError(null);
      setArrivalCity(city);
      return;
    }

    setDepartureCity(city);
    setDepartureError(null);
    setArrivalError(null);
    if (arrivalCityRef.current?.id === city.id) {
      setArrivalCity(null);
    }
  }, [t]);

  return (
    <View style={styles.root}>
      <View style={styles.form}>
        <View style={styles.segmentWrap}>
          <SegmentControl
            variant="onBrand"
            options={vehicleModeOptions}
            value={vehicleMode}
            onChange={setVehicleMode}
          />
        </View>

        <View style={styles.routeBlock}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDepartureError(null);
              setArrivalError(null);
              setCityPickerMode('departure');
            }}
            style={({ pressed }) => [
              styles.field,
              styles.routeCityInput,
              departureError ? styles.fieldError : null,
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="arrow-up" size={13} color={colors.white} />
            <AppText
              weight="semibold"
              style={[styles.fieldValue, !departureCity && styles.fieldPlaceholder]}
              numberOfLines={1}
            >
              {departureCity?.label ?? t('dashboard.search.departure')}
            </AppText>
          </Pressable>
          {departureError ? (
            <AppText style={styles.arrivalErrorText}>{departureError}</AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={openArrivalPicker}
            style={({ pressed }) => [
              styles.field,
              styles.routeCityInput,
              arrivalError ? styles.fieldError : null,
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="arrow-down" size={13} color={colors.white} />
            <AppText
              weight="semibold"
              style={[styles.fieldValue, !arrivalCity && styles.fieldPlaceholder]}
              numberOfLines={1}
            >
              {arrivalCity?.label ?? t('dashboard.search.arrival')}
            </AppText>
          </Pressable>
          {arrivalError ? (
            <AppText style={styles.arrivalErrorText}>{arrivalError}</AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.search.swapCities')}
            onPress={handleSwapCities}
            style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}
          >
            <FontAwesome name="exchange" size={13} color={colors.white} style={styles.swapIcon} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [styles.dateMainPress, pressed && styles.pressed]}
          >
            <FontAwesome name="calendar" size={13} color={colors.white} />
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
            <FontAwesome name="user" size={13} color={colors.white} />
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
            <FontAwesome name="search" size={17} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.resultsCard}>
        <AppText style={styles.searchHint}>{t('dashboard.search.searchHint')}</AppText>
      </View>

      <SearchCityPickerModal
        visible={cityPickerMode != null}
        mode={cityPickerMode ?? 'departure'}
        value={cityPickerMode === 'arrival' ? arrivalCity : departureCity}
        excludeCityId={cityPickerMode === 'arrival' ? departureCity?.id : undefined}
        onClose={handleCityPickerClose}
        onSelect={handleCityPickerSelect}
      />

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  form: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 6,
    backgroundColor: colors.primary,
  },
  segmentWrap: {
    alignSelf: 'flex-start',
    width: '50%',
  },
  routeBlock: {
    position: 'relative',
    gap: 6,
  },
  routeCityInput: {
    paddingRight: 48,
  },
  fieldError: {
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomColor: '#FFB4A8',
    borderBottomWidth: 2,
  },
  arrivalErrorText: {
    marginTop: 2,
    marginBottom: 0,
    paddingHorizontal: spacing.xs,
    fontSize: 12,
    lineHeight: 15,
    color: '#FFD5CF',
  },
  swapButton: {
    position: 'absolute',
    right: spacing.sm,
    top: 28,
    marginTop: 0,
    width: 34,
    height: 34,
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
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
  },
  fieldPlaceholder: {
    color: colors.text.onBrandMuted,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
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
    width: 28,
    height: 28,
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
    minWidth: 22,
    textAlign: 'center',
    fontSize: 15,
    color: colors.white,
  },
  searchButton: {
    width: 48,
    height: 48,
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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  searchHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
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
