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
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import {
  parseTripSeats,
  TripPaymentMethodSection,
} from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import type { TripCity, TripDraft, TripLocationPoint } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

type TripDetailsStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

type CityPickerMode = 'departure' | 'arrival' | null;

function formatWhenChip(
  iso: string | null,
  locale: string,
  timeConfirmed: boolean,
): { date: string | null; time: string | null } {
  if (!iso) {
    return { date: null, time: null };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: null, time: null };
  }
  const latinLocale = withLatinDigitsLocale(locale);
  return {
    date: parsed.toLocaleDateString(latinLocale, { day: 'numeric', month: 'short' }),
    time: timeConfirmed
      ? parsed.toLocaleTimeString(latinLocale, { hour: 'numeric', minute: '2-digit' })
      : null,
  };
}

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
}: TripDetailsStepProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';
  const isShared = draft.vehicleMode === 'shared';
  const { openMapPickerForSelection, mapPickerSheet } = useLocationMapPicker();
  const [cityPickerMode, setCityPickerMode] = React.useState<CityPickerMode>(null);
  const [dateTimeSheet, setDateTimeSheet] = React.useState<CityPickerMode>(null);
  const [departureError, setDepartureError] = React.useState<string | null>(null);
  const [arrivalError, setArrivalError] = React.useState<string | null>(null);

  const startDateRequired = draft.vehicleMode === 'shared';
  const departureWindowEnd = draft.departureUntil
    ? new Date(draft.departureUntil)
    : draft.departureAt
      ? new Date(draft.departureAt)
      : undefined;
  const arrivalTimeError = getArrivalTimeError(draft, t);
  const canContinue = isDetailsComplete(draft, isPassenger) && !arrivalTimeError;
  const departureWhen = formatWhenChip(draft.departureAt, locale, draft.departureTimeSet);
  const arrivalWhen = formatWhenChip(draft.arrivalAt, locale, draft.arrivalTimeSet);

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
          arrivalPoint: draft.arrivalCity?.id === city.id ? draft.arrivalPoint : null,
        });
        return;
      }

      setDepartureError(null);
      setArrivalError(null);
      const next: Partial<TripDraft> = {
        departureCity: city,
        departurePoint: draft.departureCity?.id === city.id ? draft.departurePoint : null,
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
      draft.arrivalPoint,
      draft.departureCity?.id,
      draft.departurePoint,
      onChange,
      t,
    ],
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

  return (
    <>
      <AuthCard>
        <View style={styles.form}>
          <View style={styles.routeBlock}>
            <View style={styles.routeSection}>
              <View style={styles.labelRow}>
                <AppText weight="medium" style={[styles.fieldLabel, styles.cityField]}>
                  {t('trips.create.departure')}
                  <AppText style={styles.requiredMark}> *</AppText>
                </AppText>
                <View style={styles.whenLabelWrap}>
                  <AppText weight="medium" style={styles.whenLabel} numberOfLines={1}>
                    {t('trips.create.date')}
                    {startDateRequired ? <AppText style={styles.requiredMark}> *</AppText> : null}
                  </AppText>
                </View>
              </View>
              <View style={styles.routeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDepartureError(null);
                    setCityPickerMode('departure');
                  }}
                  style={({ pressed }) => [
                    styles.field,
                    styles.cityField,
                    departureError ? styles.fieldError : null,
                    pressed && styles.pressed,
                  ]}
                >
                  <FontAwesome name="arrow-up" size={13} color={colors.text.secondary} />
                  <View style={styles.fieldCopy}>
                    <AppText
                      weight="semibold"
                      style={[styles.fieldValue, !draft.departureCity && styles.fieldPlaceholder]}
                      numberOfLines={1}
                    >
                      {draft.departureCity?.label ?? t('trips.create.cityPlaceholder')}
                    </AppText>
                    {draft.departurePoint?.label ? (
                      <AppText style={styles.fieldAddress} numberOfLines={1}>
                        {draft.departurePoint.label}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    startDateRequired
                      ? `${t('trips.create.departureDateTime')} *`
                      : t('trips.create.departureDateTime')
                  }
                  onPress={() => setDateTimeSheet('departure')}
                  style={({ pressed }) => [
                    styles.whenChip,
                    startDateRequired && !draft.departureAt ? styles.whenChipRequired : null,
                    pressed && styles.pressed,
                  ]}
                >
                  <FontAwesome name="calendar" size={12} color={colors.primary} />
                  <AppText weight="semibold" style={styles.whenDate} numberOfLines={1}>
                    {departureWhen.date ?? t('trips.create.date')}
                  </AppText>
                  <AppText style={styles.whenTime} numberOfLines={1}>
                    {departureWhen.time ?? t('trips.create.time')}
                  </AppText>
                </Pressable>
              </View>
              {departureError ? <AppText style={styles.errorText}>{departureError}</AppText> : null}
            </View>

            <View style={styles.routeSection}>
              <View style={styles.labelRow}>
                <AppText weight="medium" style={[styles.fieldLabel, styles.cityField]}>
                  {t('trips.create.arrival')}
                  <AppText style={styles.requiredMark}> *</AppText>
                </AppText>
                <View style={styles.whenLabelWrap}>
                  <AppText weight="medium" style={styles.whenLabel} numberOfLines={1}>
                    {t('trips.create.date')}
                  </AppText>
                </View>
              </View>
              <View style={styles.routeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setArrivalError(null);
                    setCityPickerMode('arrival');
                  }}
                  style={({ pressed }) => [
                    styles.field,
                    styles.cityField,
                    arrivalError ? styles.fieldError : null,
                    pressed && styles.pressed,
                  ]}
                >
                  <FontAwesome name="arrow-down" size={13} color={colors.text.secondary} />
                  <View style={styles.fieldCopy}>
                    <AppText
                      weight="semibold"
                      style={[styles.fieldValue, !draft.arrivalCity && styles.fieldPlaceholder]}
                      numberOfLines={1}
                    >
                      {draft.arrivalCity?.label ?? t('trips.create.cityPlaceholder')}
                    </AppText>
                    {draft.arrivalPoint?.label ? (
                      <AppText style={styles.fieldAddress} numberOfLines={1}>
                        {draft.arrivalPoint.label}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('trips.create.arrivalDateTime')}
                  onPress={() => setDateTimeSheet('arrival')}
                  style={({ pressed }) => [styles.whenChip, pressed && styles.pressed]}
                >
                  <FontAwesome name="calendar" size={12} color={colors.primary} />
                  <AppText weight="semibold" style={styles.whenDate} numberOfLines={1}>
                    {arrivalWhen.date ?? t('trips.create.date')}
                  </AppText>
                  <AppText style={styles.whenTime} numberOfLines={1}>
                    {arrivalWhen.time ?? t('trips.create.time')}
                  </AppText>
                </Pressable>
              </View>
              {arrivalError ? <AppText style={styles.errorText}>{arrivalError}</AppText> : null}
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

          <Button label={t('common.continue')} onPress={onContinue} disabled={!canContinue} />
        </View>
      </AuthCard>

      <SearchCityPickerModal
        visible={cityPickerMode != null}
        mode={cityPickerMode ?? 'departure'}
        value={cityPickerMode === 'arrival' ? draft.arrivalCity : draft.departureCity}
        excludeCityId={cityPickerMode === 'arrival' ? draft.departureCity?.id : undefined}
        onClose={() => setCityPickerMode(null)}
        onSelect={handleCitySelect}
        onChooseMap={() => {
          const mode = cityPickerMode ?? 'departure';
          openMapForMode(mode);
        }}
      />
      <AppBottomSheet
        visible={dateTimeSheet != null}
        onClose={() => setDateTimeSheet(null)}
        heightRatio={0.52}
      >
        <View style={styles.sheetBody}>
          <AppText weight="bold" style={styles.sheetTitle}>
            {dateTimeSheet === 'arrival'
              ? t('trips.create.arrivalDateTime')
              : t('trips.create.departureDateTime')}
            {dateTimeSheet === 'departure' && startDateRequired ? (
              <AppText style={styles.requiredMark}> *</AppText>
            ) : (
              <AppText style={styles.optionalMark}> (optional)</AppText>
            )}
          </AppText>
          {dateTimeSheet === 'arrival' ? (
            <DateTimePickerField
              variant="search"
              hideLabel
              label={t('trips.create.arrivalDateTime')}
              value={draft.arrivalAt}
              onChange={(arrivalAt, part) =>
                onChange(part === 'time' ? { arrivalAt, arrivalTimeSet: true } : { arrivalAt })
              }
              minimumDate={departureWindowEnd}
              timeConfirmed={draft.arrivalTimeSet}
              optional
            />
          ) : (
            <DateTimePickerField
              variant="search"
              hideLabel
              label={t('trips.create.departureDateTime')}
              value={draft.departureAt}
              onChange={(departureAt, part) =>
                onChange(part === 'time' ? { departureAt, departureTimeSet: true } : { departureAt })
              }
              minimumDate={new Date()}
              timeConfirmed={draft.departureTimeSet}
              required={startDateRequired}
              optional={!startDateRequired}
              onClear={
                startDateRequired
                  ? undefined
                  : () => onChange({ departureAt: null, departureTimeSet: false })
              }
            />
          )}
          <Button label={t('common.done')} onPress={() => setDateTimeSheet(null)} />
        </View>
      </AppBottomSheet>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  whenLabelWrap: {
    width: 52,
    alignItems: 'center',
  },
  whenLabel: {
    fontSize: 11,
    color: colors.text.primary,
    textAlign: 'center',
  },
  requiredMark: {
    fontSize: 13,
    color: colors.primary,
  },
  optionalMark: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  cityField: {
    flex: 1,
    minWidth: 0,
  },
  sheetBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.text.primary,
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
  whenChip: {
    width: 52,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    gap: 0,
  },
  whenChipRequired: {
    borderColor: colors.primary,
  },
  whenDate: {
    fontSize: 10,
    color: colors.text.primary,
  },
  whenTime: {
    fontSize: 9,
    color: colors.text.secondary,
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
  pressed: {
    opacity: 0.85,
  },
  textArea: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
});
