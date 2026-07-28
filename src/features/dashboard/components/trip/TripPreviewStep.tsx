import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListingCard } from '@/features/dashboard/components/ListingCard';
import { formatTripDateTime } from '@/features/dashboard/components/trip/dateRangeUtils';
import { TripDetailsOverview } from '@/features/dashboard/components/trip/TripDetailsOverview';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import {
  draftToTrip,
  type Trip,
  type TripDraft,
} from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

export type TripPreviewEditStep =
  | 'vehicle'
  | 'vehicleMode'
  | 'details'
  | 'listing'
  | 'schedule';

type TripPreviewStepProps = {
  draft: TripDraft;
  vehicle: Vehicle | undefined;
  onPublish: () => void;
  onEditStep: (step: TripPreviewEditStep) => void;
  publishing?: boolean;
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
    vehiclePhotoCount: vehicle?.photoUris.length ?? base.vehiclePhotoCount,
    vehicleClass: vehicle?.vehicleClass ?? base.vehicleClass,
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
  errorMessage = null,
}: TripPreviewStepProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;

  const trip = enrichPreviewTrip(draft, vehicle);
  const fromCity = draft.departureCity
    ? cityDisplayName(draft.departureCity.label)
    : null;
  const toCity = draft.arrivalCity ? cityDisplayName(draft.arrivalCity.label) : null;
  const modeLabel =
    draft.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : draft.vehicleMode === 'shared'
        ? t('trips.create.vehicleModeShared')
        : null;
  const description =
    draft.description.trim() ||
    (fromCity && toCity
      ? t('dashboard.listings.detail.descriptionBody', {
          from: fromCity,
          to: toCity,
          vehicle: vehicle?.title ?? t('trips.create.previewVehicle'),
          mode: modeLabel ?? t('trips.create.notSpecified'),
        })
      : null);
  const departureWhen = draft.departureAt
    ? formatTripDateTime(draft.departureAt, locale, '')
    : undefined;
  const arrivalWhen = draft.arrivalAt
    ? formatTripDateTime(draft.arrivalAt, locale, '')
    : undefined;

  return (
    <View style={styles.root}>
      {trip ? <ListingCard trip={trip} /> : null}

      <TripDetailsOverview
        description={description}
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
        accessibilityLabel={t('trips.create.publish')}
        accessibilityState={{ busy: publishing, disabled: publishing }}
      >
        {publishing ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="paper-plane" size={14} color={colors.white} />
            <AppText weight="bold" style={styles.publishButtonText}>
              {t('trips.create.publish')}
            </AppText>
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
  actionDisabled: {
    opacity: 0.7,
  },
});
