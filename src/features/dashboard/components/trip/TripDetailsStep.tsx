import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { useLocationMapPicker } from '@/features/auth/hooks/useLocationMapPicker';
import { resolveCityAndPointFromCoords } from '@/features/auth/utils/geocodedAddressLabel';
import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
import { SearchCityPickerModal } from '@/features/dashboard/components/SearchCityPickerModal';
import { DateRangeCalendarField } from '@/features/dashboard/components/trip/DateRangeCalendarField';
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import {
  isMultiDayWindow,
  MAX_DATE_WINDOW_DAYS,
} from '@/features/dashboard/components/trip/dateRangeUtils';
import {
  parseTripSeats,
  TripPaymentMethodSection,
} from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import type { TripCity, TripDraft, TripLocationPoint } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { tripApi } from '@/services/api/tripApi';
import type { TripSubzonePointDto } from '@/services/api/tripApi.types';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

function shouldShowPointLabel(
  city: TripCity | null,
  point: TripLocationPoint | null,
): boolean {
  if (!point?.label?.trim() || !city?.label?.trim()) {
    return false;
  }
  return cityDisplayName(point.label) !== cityDisplayName(city.label);
}

function matchSavedLocation(
  city: TripCity | null,
  point: TripLocationPoint | null,
  savedLocations: TripSubzonePointDto[],
): TripSubzonePointDto | null {
  if (!city || !point) {
    return null;
  }

  return (
    savedLocations.find((location) => {
      if (location.name.trim() !== point.label.trim()) {
        return false;
      }

      const locationCityId = location.cityId ?? `subzone-${location.id}`;
      if (city.id === locationCityId || city.id === location.id) {
        return true;
      }

      return (
        cityDisplayName(location.cityLabel) === cityDisplayName(city.label) &&
        Math.abs(location.latitude - point.latitude) < 0.00001 &&
        Math.abs(location.longitude - point.longitude) < 0.00001
      );
    }) ?? null
  );
}

function getRouteFieldDisplay(
  city: TripCity | null,
  point: TripLocationPoint | null,
  savedLocation: TripSubzonePointDto | null,
  placeholder: string,
): { primary: string; secondary: string | null; isPlaceholder: boolean } {
  if (savedLocation) {
    return {
      primary: savedLocation.name,
      secondary: cityDisplayName(savedLocation.cityLabel),
      isPlaceholder: false,
    };
  }

  if (city) {
    return {
      primary: city.label,
      secondary: shouldShowPointLabel(city, point) ? point?.label ?? null : null,
      isPlaceholder: false,
    };
  }

  return {
    primary: placeholder,
    secondary: null,
    isPlaceholder: true,
  };
}

type TripDetailsStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
  errorMessage?: string | null;
};

type CityPickerMode = 'departure' | 'arrival' | null;

function isDetailsComplete(draft: TripDraft, isPassenger: boolean): boolean {
  const startDateRequired = draft.vehicleMode === 'shared';
  const routeOk = Boolean(
    draft.departureCity &&
      draft.arrivalCity &&
      (!startDateRequired || draft.departureAt),
  );
  if (!routeOk) {
    return false;
  }
  if (draft.vehicleMode !== 'shared') {
    return true;
  }
  if (!draft.paymentMethod) {
    return false;
  }
  if (isPassenger) {
    const seatsParsed = Number.parseInt(draft.seats.trim(), 10);
    return Number.isInteger(seatsParsed) && seatsParsed >= 1 && seatsParsed <= 50;
  }
  return draft.startingPrice.trim().length > 0;
}

function getArrivalTimeError(draft: TripDraft, t: (key: string) => string): string | null {
  if (!draft.departureAt || !draft.arrivalAt) {
    return null;
  }
  const depMs = new Date(draft.departureAt).getTime();
  const arrMs = new Date(draft.arrivalAt).getTime();
  if (arrMs <= depMs) {
    return t('trips.create.arrivalAfterDepartureError');
  }
  return null;
}

export function TripDetailsStep({
  draft,
  onChange,
  onContinue,
  errorMessage,
}: TripDetailsStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';
  const isShared = draft.vehicleMode === 'shared';
  const { openMapPickerForSelection, mapPickerSheet } = useLocationMapPicker();
  const [cityPickerMode, setCityPickerMode] = React.useState<CityPickerMode>(null);
  const [departureError, setDepartureError] = React.useState<string | null>(null);
  const [arrivalError, setArrivalError] = React.useState<string | null>(null);
  const [savedLocations, setSavedLocations] = React.useState<TripSubzonePointDto[]>([]);

  React.useEffect(() => {
    void tripApi
      .listSubzones()
      .then((result) => setSavedLocations(result.items))
      .catch(() => undefined);
  }, []);

  const startDateRequired = draft.vehicleMode === 'shared';
  const departureWindowEnd = draft.departureUntil
    ? new Date(draft.departureUntil)
    : draft.departureAt
      ? new Date(draft.departureAt)
      : undefined;
  const arrivalTimeError = getArrivalTimeError(draft, t);
  const canContinue = isDetailsComplete(draft, isPassenger) && !arrivalTimeError;

  const applyMapSelection = React.useCallback(
    async (mode: 'departure' | 'arrival', selection: TripLocationPoint) => {
      const resolved = await resolveCityAndPointFromCoords(
        selection.latitude,
        selection.longitude,
        selection.label,
      );
      const city: TripCity = {
        id: resolved.cityId,
        label: cityDisplayName(resolved.cityLabel),
      };
      const point: TripLocationPoint = {
        label: resolved.address,
        latitude: selection.latitude,
        longitude: selection.longitude,
      };

      if (mode === 'departure') {
        setDepartureError(null);
        const next: Partial<TripDraft> = { departureCity: city, departurePoint: point };
        if (draft.arrivalCity?.id === city.id || draft.arrivalCity?.label === city.label) {
          next.arrivalCity = null;
          next.arrivalPoint = null;
        }
        onChange(next);
        return;
      }

      if (draft.departureCity && (draft.departureCity.id === city.id || draft.departureCity.label === city.label)) {
        setArrivalError(t('dashboard.search.sameCityNotAllowed'));
        return;
      }
      setArrivalError(null);
      onChange({ arrivalCity: city, arrivalPoint: point });
    },
    [draft.arrivalCity?.id, draft.arrivalCity?.label, draft.departureCity, onChange, t],
  );

  const handleCitySelect = React.useCallback(
    (city: TripCity) => {
      if (cityPickerMode === 'arrival') {
        if (draft.departureCity?.id === city.id) {
          setArrivalError(t('dashboard.search.sameCityNotAllowed'));
          return;
        }
        setArrivalError(null);
        onChange({
          arrivalCity: city,
          arrivalPoint: null,
        });
        return;
      }

      setDepartureError(null);
      setArrivalError(null);
      const next: Partial<TripDraft> = {
        departureCity: city,
        departurePoint: null,
      };
      if (draft.arrivalCity?.id === city.id) {
        next.arrivalCity = null;
        next.arrivalPoint = null;
      }
      onChange(next);
    },
    [
      cityPickerMode,
      draft.arrivalCity?.id,
      draft.departureCity?.id,
      onChange,
      t,
    ],
  );

  const applySavedLocation = React.useCallback(
    (location: TripSubzonePointDto, mode: 'departure' | 'arrival') => {
      const city: TripCity = {
        id: location.cityId ?? `subzone-${location.id}`,
        label: cityDisplayName(location.cityLabel),
      };
      const point: TripLocationPoint = {
        label: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      if (mode === 'departure') {
        setDepartureError(null);
        setArrivalError(null);
        const next: Partial<TripDraft> = { departureCity: city, departurePoint: point };
        if (draft.arrivalCity?.id === city.id || draft.arrivalCity?.label === city.label) {
          next.arrivalCity = null;
          next.arrivalPoint = null;
        }
        onChange(next);
        return;
      }

      if (draft.departureCity?.id === city.id || draft.departureCity?.label === city.label) {
        setArrivalError(t('dashboard.search.sameCityNotAllowed'));
        return;
      }
      setArrivalError(null);
      onChange({ arrivalCity: city, arrivalPoint: point });
    },
    [draft.arrivalCity?.id, draft.arrivalCity?.label, draft.departureCity, onChange, t],
  );

  const handleSavedLocationSelect = React.useCallback(
    (location: TripSubzonePointDto) => {
      const mode = cityPickerMode ?? 'departure';
      applySavedLocation(location, mode);
      setCityPickerMode(null);
    },
    [applySavedLocation, cityPickerMode],
  );

  const openMapForMode = React.useCallback(
    (mode: 'departure' | 'arrival') => {
      const initial = mode === 'departure' ? draft.departurePoint : draft.arrivalPoint;
      openMapPickerForSelection((selection) => {
        void applyMapSelection(mode, selection);
      }, initial);
    },
    [applyMapSelection, draft.arrivalPoint, draft.departurePoint, openMapPickerForSelection],
  );

  const savedDeparture = matchSavedLocation(
    draft.departureCity,
    draft.departurePoint,
    savedLocations,
  );
  const savedArrival = matchSavedLocation(draft.arrivalCity, draft.arrivalPoint, savedLocations);
  const departureDisplay = getRouteFieldDisplay(
    draft.departureCity,
    draft.departurePoint,
    savedDeparture,
    t('trips.create.cityPlaceholder'),
  );
  const arrivalDisplay = getRouteFieldDisplay(
    draft.arrivalCity,
    draft.arrivalPoint,
    savedArrival,
    t('trips.create.cityPlaceholder'),
  );

  return (
    <>
      <AuthCard>
        <View style={styles.form}>
          <View style={styles.routeBlock}>
            <View style={styles.routeSection}>
              <AppText weight="medium" style={styles.fieldLabel}>
                {t('trips.create.departure')}
                <AppText style={styles.requiredMark}> *</AppText>
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDepartureError(null);
                  setCityPickerMode('departure');
                }}
                style={({ pressed }) => [
                  styles.field,
                  departureError ? styles.fieldError : null,
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="arrow-up" size={13} color={colors.text.secondary} />
                <View style={styles.fieldCopy}>
                  <AppText
                    weight="semibold"
                    style={[
                      styles.fieldValue,
                      departureDisplay.isPlaceholder && styles.fieldPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {departureDisplay.primary}
                  </AppText>
                  {departureDisplay.secondary ? (
                    <AppText style={styles.fieldAddress} numberOfLines={1}>
                      {departureDisplay.secondary}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
              {departureError ? <AppText style={styles.errorText}>{departureError}</AppText> : null}
              {isShared ? (
                <DateTimePickerField
                  inline
                  variant="search"
                  label={t('trips.create.departureDateTime')}
                  value={draft.departureAt}
                  onChange={(departureAt, part) =>
                    onChange(part === 'time' ? { departureAt, departureTimeSet: true } : { departureAt })
                  }
                  onClear={
                    startDateRequired
                      ? undefined
                      : () =>
                          onChange({
                            departureAt: null,
                            departureUntil: null,
                            departureTimeSet: false,
                          })
                  }
                  minimumDate={new Date()}
                  timeConfirmed={draft.departureTimeSet}
                  required={startDateRequired}
                  optional={!startDateRequired}
                />
              ) : (
                <View style={styles.windowBlock}>
                  <AppText weight="medium" style={styles.fieldLabel}>
                    {t('trips.create.departureDateWindow')}
                  </AppText>
                  <AppText style={styles.windowHint}>
                    {t('trips.create.departureWindowHint', { count: MAX_DATE_WINDOW_DAYS })}
                  </AppText>
                  <View style={styles.windowRow}>
                    <View style={styles.windowDate}>
                      <DateRangeCalendarField
                        hideLabel
                        label={t('trips.create.departureDateWindow')}
                        startIso={draft.departureAt}
                        endIso={draft.departureUntil}
                        onWindowSelected={() => onChange({ departureTimeSet: false })}
                        onChange={({ startIso, endIso }) => {
                          const window = isMultiDayWindow(startIso, endIso);
                          onChange({
                            departureAt: startIso,
                            departureUntil: endIso,
                            departureTimeSet: window ? false : draft.departureTimeSet,
                          });
                        }}
                      />
                    </View>
                    {!isMultiDayWindow(draft.departureAt, draft.departureUntil) ? (
                      <View style={styles.windowTime}>
                        <DateTimePickerField
                          hideLabel
                          mode="time"
                          variant="search"
                          label={t('trips.create.selectTime')}
                          value={draft.departureAt}
                          onChange={(departureAt) =>
                            onChange({ departureAt, departureTimeSet: true })
                          }
                          minimumDate={new Date()}
                          timeConfirmed={draft.departureTimeSet}
                          optional
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.routeSection}>
              <AppText weight="medium" style={styles.fieldLabel}>
                {t('trips.create.arrival')}
                <AppText style={styles.requiredMark}> *</AppText>
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setArrivalError(null);
                  setCityPickerMode('arrival');
                }}
                style={({ pressed }) => [
                  styles.field,
                  arrivalError ? styles.fieldError : null,
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="arrow-down" size={13} color={colors.text.secondary} />
                <View style={styles.fieldCopy}>
                  <AppText
                    weight="semibold"
                    style={[
                      styles.fieldValue,
                      arrivalDisplay.isPlaceholder && styles.fieldPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {arrivalDisplay.primary}
                  </AppText>
                  {arrivalDisplay.secondary ? (
                    <AppText style={styles.fieldAddress} numberOfLines={1}>
                      {arrivalDisplay.secondary}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
              {arrivalError ? <AppText style={styles.errorText}>{arrivalError}</AppText> : null}
              <DateTimePickerField
                inline
                variant="search"
                label={t('trips.create.arrivalDateTime')}
                value={draft.arrivalAt}
                onChange={(arrivalAt, part) =>
                  onChange(part === 'time' ? { arrivalAt, arrivalTimeSet: true } : { arrivalAt })
                }
                onClear={() => onChange({ arrivalAt: null, arrivalTimeSet: false })}
                minimumDate={departureWindowEnd}
                timeConfirmed={draft.arrivalTimeSet}
                optional
              />
            </View>
          </View>

          {arrivalTimeError ? <AppText style={styles.errorText}>{arrivalTimeError}</AppText> : null}

          <AuthTextField
            label={t('trips.create.description')}
            optional
            value={draft.description}
            onChangeText={(description) => onChange({ description })}
            placeholder={t('trips.create.descriptionPlaceholder')}
            multiline
            textAlignVertical="top"
            style={styles.textArea}
            maxLength={1000}
          />

          {isShared ? (
            <>
              {isPassenger ? (
                <SeatsStepper
                  label={t('trips.create.seats')}
                  required
                  value={parseTripSeats(draft.seats)}
                  min={1}
                  max={50}
                  onChange={(seats) => onChange({ seats: String(seats) })}
                />
              ) : (
                <AuthTextField
                  label={t('trips.create.startingPrice')}
                  required
                  value={draft.startingPrice}
                  onChangeText={(startingPrice) => onChange({ startingPrice })}
                  placeholder={t('trips.create.startingPricePlaceholder')}
                  keyboardType="decimal-pad"
                  dense
                />
              )}
              <TripPaymentMethodSection
                value={draft.paymentMethod}
                onChange={(paymentMethod) => onChange({ paymentMethod })}
              />
            </>
          ) : null}

          {errorMessage ? <AppText style={styles.submitError}>{errorMessage}</AppText> : null}
          <Button
            label={t('common.continue')}
            onPress={onContinue}
            disabled={!canContinue}
            eagerPress
          />
        </View>
      </AuthCard>

      <SearchCityPickerModal
        visible={cityPickerMode != null}
        mode={cityPickerMode ?? 'departure'}
        value={cityPickerMode === 'arrival' ? draft.arrivalCity : draft.departureCity}
        excludeCityId={cityPickerMode === 'arrival' ? draft.departureCity?.id : undefined}
        appearance="light"
        savedLocations={savedLocations}
        onClose={() => setCityPickerMode(null)}
        onSelect={handleCitySelect}
        onSelectSavedLocation={handleSavedLocationSelect}
        onChooseMap={() => {
          const mode = cityPickerMode ?? 'departure';
          openMapForMode(mode);
        }}
      />
      {mapPickerSheet}
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  routeBlock: {
    gap: spacing.sm,
  },
  routeSection: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  requiredMark: {
    fontSize: 13,
    color: colors.primary,
  },
  windowBlock: {
    gap: spacing.xs,
  },
  windowHint: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  windowDate: {
    flex: 1,
    minWidth: 0,
  },
  windowTime: {
    width: 124,
  },
  field: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  fieldPlaceholder: {
    color: colors.text.tertiary,
  },
  fieldAddress: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  fieldError: {
    borderColor: colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
    paddingHorizontal: spacing.xs,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  textArea: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
});
