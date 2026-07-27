import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListingCard } from '@/features/dashboard/components/ListingCard';
import { formatDateRangeLabel } from '@/features/dashboard/components/trip/dateRangeUtils';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import {
  draftToTrip,
  type Trip,
  type TripDraft,
  type TripLocationPoint,
} from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { useResolvedLocationPointLabel } from '@/shared/hooks/useResolvedLocationPointLabel';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { openInGoogleMaps } from '@/shared/utils/open-in-google-maps';
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

function formatDateTime(iso: string | null, locale: string): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}

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

type SectionIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
};

function SectionIcon({ name }: SectionIconProps): React.ReactElement {
  return (
    <View style={styles.sectionIcon}>
      <FontAwesome name={name} size={14} color={colors.primary} />
    </View>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
};

function SectionHeader({ icon, title }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

type LocationPointRowProps = {
  eyebrow: string;
  point: TripLocationPoint | null | undefined;
  accessibilityLabel: string;
};

function LocationPointRow({
  eyebrow,
  point,
  accessibilityLabel,
}: LocationPointRowProps): React.ReactElement | null {
  const label = useResolvedLocationPointLabel(point, '');

  if (!label.trim()) {
    return null;
  }

  const canOpen =
    point != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    !(point.latitude === 0 && point.longitude === 0);

  return (
    <Pressable
      style={({ pressed }) => [styles.pointRow, pressed && canOpen && styles.pointRowPressed]}
      disabled={!canOpen}
      onPress={() => {
        if (!point || !canOpen) {
          return;
        }
        void openInGoogleMaps(point);
      }}
      accessibilityRole={canOpen ? 'link' : 'text'}
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="map-marker" size={12} color={colors.primary} />
      <View style={styles.pointCopy}>
        <AppText style={styles.eyebrow}>{eyebrow}</AppText>
        <AppText
          weight="medium"
          style={[styles.pointValue, canOpen && styles.pointValueLink]}
        >
          {label}
        </AppText>
      </View>
      {canOpen ? (
        <FontAwesome name="external-link" size={11} color={colors.primary} />
      ) : null}
    </Pressable>
  );
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
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [descriptionTruncatable, setDescriptionTruncatable] = React.useState(false);

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
  const descriptionText = draft.description.trim()
    ? draft.description.trim()
    : fromCity && toCity
      ? t('dashboard.listings.detail.descriptionBody', {
          from: fromCity,
          to: toCity,
          vehicle: vehicle?.title ?? t('trips.create.previewVehicle'),
          mode: modeLabel ?? t('trips.create.notSpecified'),
        })
      : null;
  const departureWindow =
    draft.departureAt || draft.departureUntil
      ? formatDateRangeLabel(
          draft.departureAt,
          draft.departureUntil,
          locale,
          '',
        )
      : null;
  const arrivalWhen = formatDateTime(draft.arrivalAt, locale);
  const showDetails =
    Boolean(fromCity) ||
    Boolean(toCity) ||
    Boolean(departureWindow) ||
    Boolean(arrivalWhen) ||
    Boolean(draft.departurePoint) ||
    Boolean(draft.arrivalPoint);

  return (
    <View style={styles.root}>
      {trip ? <ListingCard trip={trip} /> : null}

      {descriptionText ? (
        <View style={styles.card}>
          <SectionHeader
            icon="align-left"
            title={t('dashboard.listings.detail.description')}
          />
          <View style={styles.descriptionWrap}>
            <AppText
              style={[styles.descriptionText, styles.descriptionMeasure]}
              pointerEvents="none"
              onTextLayout={(event) => {
                if (event.nativeEvent.lines.length > 2) {
                  setDescriptionTruncatable(true);
                }
              }}
            >
              {descriptionText}
            </AppText>
            <AppText
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : 2}
            >
              {descriptionText}
              {descriptionTruncatable ? (
                <AppText
                  weight="semibold"
                  style={styles.showMoreText}
                  onPress={() => setDescriptionExpanded((current) => !current)}
                  suppressHighlighting
                >
                  {'  '}
                  {descriptionExpanded
                    ? t('dashboard.listings.detail.showLess')
                    : t('dashboard.listings.detail.showMore')}
                </AppText>
              ) : null}
            </AppText>
          </View>
        </View>
      ) : null}

      {showDetails ? (
        <View style={styles.card}>
          <SectionHeader icon="map-marker" title={t('trips.create.detailsTitle')} />

          <View style={styles.timeline}>
            {fromCity && toCity ? (
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, styles.timelineDotStart]} />
                <View style={styles.timelineLine} />
                <View style={[styles.timelineDot, styles.timelineDotEnd]} />
              </View>
            ) : null}

            <View style={styles.timelineBody}>
              {fromCity || departureWindow || draft.departurePoint ? (
                <View style={styles.endpointBlock}>
                  {fromCity ? (
                    <View style={styles.endpointTop}>
                      <View style={styles.endpointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.departure')}</AppText>
                        <AppText weight="bold" style={styles.endpointCity}>
                          {fromCity}
                        </AppText>
                      </View>
                      {departureWindow ? (
                        <View style={styles.endpointWhen}>
                          <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                          <View style={styles.endpointWhenCopy}>
                            <AppText style={styles.whenLabel}>
                              {t('trips.create.departureDateWindow')}
                            </AppText>
                            <AppText weight="semibold" style={styles.whenValue}>
                              {departureWindow}
                            </AppText>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <LocationPointRow
                    eyebrow={t('trips.create.pickupPoint')}
                    point={draft.departurePoint}
                    accessibilityLabel={t('dashboard.listings.detail.openPickupInMaps', {
                      place: draft.departurePoint?.label ?? '—',
                    })}
                  />
                </View>
              ) : null}

              {toCity || arrivalWhen || draft.arrivalPoint ? (
                <View style={styles.endpointBlock}>
                  {toCity ? (
                    <View style={styles.endpointTop}>
                      <View style={styles.endpointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.arrival')}</AppText>
                        <AppText weight="bold" style={styles.endpointCity}>
                          {toCity}
                        </AppText>
                      </View>
                      {arrivalWhen ? (
                        <View style={styles.endpointWhen}>
                          <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                          <View style={styles.endpointWhenCopy}>
                            <AppText style={styles.whenLabel}>
                              {t('trips.create.arrivalDateTime')}
                            </AppText>
                            <AppText weight="semibold" style={styles.whenValue}>
                              {arrivalWhen}
                            </AppText>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <LocationPointRow
                    eyebrow={t('trips.create.dropoffPoint')}
                    point={draft.arrivalPoint}
                    accessibilityLabel={t('dashboard.listings.detail.openDropoffInMaps', {
                      place: draft.arrivalPoint?.label ?? '—',
                    })}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

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
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  eyebrow: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  descriptionWrap: {
    position: 'relative',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  descriptionMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  showMoreText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
  timeline: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: colors.white,
  },
  timelineDotStart: {
    borderColor: colors.accent.green.text,
  },
  timelineDotEnd: {
    borderColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  timelineBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  endpointBlock: {
    gap: spacing.xs,
  },
  endpointTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  endpointCopy: {
    flexShrink: 1,
    gap: 1,
  },
  endpointCity: {
    fontSize: 16,
    color: colors.text.primary,
  },
  endpointWhen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '58%',
  },
  endpointWhenCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  whenLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  whenValue: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 2,
    paddingVertical: 2,
  },
  pointRowPressed: {
    opacity: 0.75,
  },
  pointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pointValue: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  pointValueLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
  publishButton: {
    minHeight: 52,
    borderRadius: radius.md,
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
