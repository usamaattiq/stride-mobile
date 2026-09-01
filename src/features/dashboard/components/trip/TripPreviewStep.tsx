import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListingCard } from '@/features/dashboard/components/ListingCard';
import { VEHICLE_CLASS_OPTIONS } from '@/features/dashboard/constants/vehicleClasses';
import { formatDateRangeLabel, formatTripDateTime, isMultiDayWindow } from '@/features/dashboard/components/trip/dateRangeUtils';
import { TripDetailsOverview } from '@/features/dashboard/components/trip/TripDetailsOverview';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import {
  draftToTrip,
  isSeaOrAirRoute,
  type Trip,
  type TripDraft,
} from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { ENV } from '@/shared/config/env';
import { useLocalizedCityName } from '@/shared/hooks/useLocalizedCityName';
import { formatLatinNumber } from '@/shared/utils/latin-digits';
import { colors, iosArabicOpticalAlignStyle, radius, spacing } from '@/theme';

export type TripPreviewEditStep =
  | 'routeType'
  | 'vehicle'
  | 'vehicleMode'
  | 'details'
  | 'luggage'
  | 'listing'
  | 'schedule';

type TripPreviewStepProps = {
  draft: TripDraft;
  vehicle: Vehicle | undefined;
  onPublish: () => void;
  onEditStep: (step: TripPreviewEditStep) => void;
  publishing?: boolean;
  publishCost?: number;
  errorMessage?: string | null;
};

function enrichPreviewTrip(draft: TripDraft, vehicle: Vehicle | undefined): Trip | null {
  const base = draftToTrip(draft, 'preview');
  if (!base) {
    return null;
  }

  return {
    ...base,
    vehicleTitle: vehicle?.title ?? base.vehicleTitle,
    vehiclePhotoUrl:
      vehicle?.photoDisplayUris?.[0] ?? vehicle?.photoUris[0] ?? base.vehiclePhotoUrl,
    vehiclePhotoUrls:
      vehicle?.photoDisplayUris?.length
        ? vehicle.photoDisplayUris
        : vehicle?.photoUris ?? base.vehiclePhotoUrls,
    vehiclePhotoCount: vehicle?.photoUris.length ?? base.vehiclePhotoCount,
    vehicleClass: vehicle?.vehicleClass ?? draft.vehicleClass ?? base.vehicleClass,
    vehicleTotalSeats: vehicle?.totalSeats ?? base.vehicleTotalSeats,
    // Keep only real points for maps / display (not city placeholders).
    departurePoint: draft.departurePoint ?? base.departurePoint,
    arrivalPoint: draft.arrivalPoint ?? base.arrivalPoint,
  };
}

export function TripPreviewStep({
  draft,
  vehicle,
  onPublish,
  publishing = false,
  publishCost = ENV.tripCreateCredits,
  errorMessage = null,
}: TripPreviewStepProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';
  const locale = i18n.language;
  const iosArabicAlign =
    currentLanguage === 'ar' ? iosArabicOpticalAlignStyle : null;
  const publishLabel = t(
    isPassenger ? 'trips.create.publishRequest' : 'trips.create.publish',
  );
  const publishCostLabel = formatLatinNumber(publishCost);

  const trip = enrichPreviewTrip(draft, vehicle);
  const seaOrAir = isSeaOrAirRoute(draft.routeType);
  const fromCityName = useLocalizedCityName(
    draft.departureCity,
    seaOrAir ? undefined : draft.departurePoint,
  );
  const toCityName = useLocalizedCityName(
    draft.arrivalCity,
    seaOrAir ? undefined : draft.arrivalPoint,
  );
  const fromCity = fromCityName || null;
  const toCity = toCityName || null;
  const modeLabel =
    draft.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : draft.vehicleMode === 'shared'
        ? t('trips.create.vehicleModeShared')
        : null;
  const vehicleLabel =
    vehicle?.title ??
    (draft.routeType === 'sea'
      ? t('trips.create.routeTypeSea')
      : draft.routeType === 'air'
        ? t('trips.create.routeTypeAir')
        : draft.vehicleClass
          ? t(
              VEHICLE_CLASS_OPTIONS.find((item) => item.id === draft.vehicleClass)?.labelKey ??
                'vehicles.classPlaceholder',
            )
          : t('trips.create.previewVehicle'));
  const description =
    draft.description.trim() ||
    (fromCity && toCity
      ? t('dashboard.listings.detail.descriptionBody', {
          from: fromCity,
          to: toCity,
          vehicle: vehicleLabel,
          mode: modeLabel ?? t('trips.create.notSpecified'),
        })
      : null);
  const departureWhen = !draft.departureAt
    ? t('dashboard.listings.card.open')
    : isMultiDayWindow(draft.departureAt, draft.departureUntil)
      ? formatDateRangeLabel(draft.departureAt, draft.departureUntil, locale, '')
      : draft.departureTimeSet
        ? formatTripDateTime(draft.departureAt, locale, '')
        : formatDateRangeLabel(draft.departureAt, null, locale, '');
  const arrivalWhen = !draft.arrivalAt
    ? undefined
    : draft.arrivalTimeSet
      ? formatTripDateTime(draft.arrivalAt, locale, '')
      : formatDateRangeLabel(draft.arrivalAt, null, locale, '');

  return (
    <View style={styles.root}>
      {trip ? <ListingCard trip={trip} pending /> : null}

      <TripDetailsOverview
        description={description}
        luggage={trip?.luggage ?? null}
        fromCity={fromCity}
        toCity={toCity}
        departureWhen={departureWhen}
        arrivalWhen={arrivalWhen}
        departurePoint={draft.departurePoint}
        arrivalPoint={draft.arrivalPoint}
      />

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      <Pressable
        onPress={onPublish}
        disabled={publishing}
        style={({ pressed }) => [
          styles.publishButton,
          pressed && !publishing && styles.publishButtonPressed,
          publishing && styles.actionDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${publishLabel}, ${t('trips.create.publishCostA11y', { count: publishCostLabel })}`}
        accessibilityState={{ busy: publishing, disabled: publishing }}
      >
        {publishing ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="paper-plane" size={14} color={colors.white} />
            <AppText weight="bold" style={[styles.publishButtonText, iosArabicAlign]}>
              {publishLabel}
            </AppText>
            <View style={styles.publishCost}>
              <FontAwesome5 name="coins" size={12} color={colors.accent.coins} solid />
              <AppText weight="bold" style={styles.publishCostText}>
                {publishCostLabel}
              </AppText>
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
  publishButton: {
    minHeight: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  publishButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  publishButtonText: {
    fontSize: 14,
    color: colors.white,
  },
  publishCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: spacing.xxs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  publishCostText: {
    fontSize: 13,
    color: colors.white,
  },
  actionDisabled: {
    opacity: 0.7,
  },
});
