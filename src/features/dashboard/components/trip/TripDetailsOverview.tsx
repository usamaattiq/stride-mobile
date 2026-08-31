import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LUGGAGE_TYPE_LABEL_KEYS } from '@/features/dashboard/constants/routeTypes';
import type { TripLocationPoint, TripLuggage } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import type { RfqOfferVehicleSummary } from '@/services/api/rfqApi.types';
import { AppText } from '@/shared/components/AppText';
import { useResolvedLocationPointLabel } from '@/shared/hooks/useResolvedLocationPointLabel';
import { openInGoogleMaps } from '@/shared/utils/open-in-google-maps';
import { colors, radius, spacing } from '@/theme';

import { OfferVehicleDetailSheet } from './OfferVehicleDetailSheet';

export type TripDetailsOverviewProps = {
  description?: string | null;
  listingVehicle?: RfqOfferVehicleSummary | null;
  /** Sea / air passenger requests declare what they are bringing. */
  luggage?: TripLuggage | null;
  fromCity?: string | null;
  toCity?: string | null;
  /** When omitted, the departure schedule row is hidden. */
  departureWhen?: string;
  /** When omitted, the arrival schedule row is hidden. */
  arrivalWhen?: string;
  departurePoint?: TripLocationPoint | null;
  arrivalPoint?: TripLocationPoint | null;
};

type SectionIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
};

function SectionIcon({ name }: SectionIconProps): React.ReactElement {
  return (
    <View style={styles.sectionIcon}>
      <FontAwesome name={name} size={18} color={colors.primary} />
    </View>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  meta?: { area: string | null; weight: string | null } | null;
  right?: React.ReactNode;
};

function SectionHeader({ icon, title, meta, right }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        <AppText weight="bold" style={styles.sectionTitle} numberOfLines={1}>
          {title}
        </AppText>
        {meta?.area || meta?.weight ? (
          <View style={styles.sectionMetaRow}>
            {meta.area ? (
              <AppText style={styles.sectionMeta} numberOfLines={1}>
                {meta.area}
              </AppText>
            ) : null}
            {meta.weight ? (
              <AppText style={styles.sectionMeta} numberOfLines={1}>
                {meta.weight}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );
}

function luggagePieces(luggage: TripLuggage) {
  if (luggage.option !== 'checked') {
    return [];
  }
  if (luggage.items?.length) {
    return luggage.items;
  }
  return [
    {
      type: luggage.type,
      lengthCm: luggage.lengthCm,
      widthCm: luggage.widthCm,
      weightKg: luggage.weightKg,
    },
  ];
}

function luggageTotalsMeta(
  luggage: TripLuggage,
  t: (key: string, options?: Record<string, string>) => string,
): { area: string | null; weight: string | null } {
  const empty = { area: null, weight: null };
  const pieces = luggagePieces(luggage);
  if (pieces.length === 0) {
    return empty;
  }
  let area = 0;
  let weight = 0;
  for (const piece of pieces) {
    if (piece.lengthCm != null && piece.widthCm != null) {
      area += piece.lengthCm * piece.widthCm;
    }
    if (piece.weightKg != null) {
      weight += piece.weightKg;
    }
  }
  const areaLabel = Number.isInteger(area) ? String(area) : area.toFixed(1);
  const weightLabel = Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
  return {
    area:
      area > 0
        ? t('dashboard.listings.detail.luggageTotalsArea', { area: areaLabel })
        : null,
    weight:
      weight > 0
        ? t('dashboard.listings.detail.luggageTotalsWeight', { weight: weightLabel })
        : null,
  };
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

export function TripDetailsOverview({
  description,
  listingVehicle = null,
  luggage = null,
  fromCity,
  toCity,
  departureWhen,
  arrivalWhen,
  departurePoint,
  arrivalPoint,
}: TripDetailsOverviewProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [luggageExpanded, setLuggageExpanded] = React.useState(false);
  const [vehicleSheetOpen, setVehicleSheetOpen] = React.useState(false);

  React.useEffect(() => {
    setDescriptionExpanded(false);
  }, [description]);

  React.useEffect(() => {
    setLuggageExpanded(false);
  }, [luggage]);

  const showDetails =
    Boolean(fromCity) ||
    Boolean(toCity) ||
    departureWhen !== undefined ||
    arrivalWhen !== undefined ||
    Boolean(departurePoint) ||
    Boolean(arrivalPoint);

  const showDepartureBlock =
    Boolean(fromCity) || departureWhen !== undefined || Boolean(departurePoint);
  const showArrivalBlock =
    Boolean(toCity) || arrivalWhen !== undefined || Boolean(arrivalPoint);

  return (
    <View style={styles.root}>
      {listingVehicle ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => setVehicleSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.responses.viewVehicleA11y', {
            title: listingVehicle.title,
          })}
        >
          <SectionHeader
            icon="car"
            title={t('dashboard.listings.detail.vehicle')}
            right={<FontAwesome name="chevron-right" size={14} color={colors.text.tertiary} />}
          />
        </Pressable>
      ) : null}

      {description ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => setDescriptionExpanded((current) => !current)}
          accessibilityRole="button"
          accessibilityState={{ expanded: descriptionExpanded }}
          accessibilityLabel={
            descriptionExpanded
              ? t('dashboard.listings.detail.showLess')
              : t('dashboard.listings.detail.showMore')
          }
        >
          <SectionHeader
            icon="align-left"
            title={t('dashboard.listings.detail.description')}
            right={
              <FontAwesome
                name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.text.tertiary}
              />
            }
          />
          {descriptionExpanded ? (
            <AppText style={styles.descriptionText}>{description}</AppText>
          ) : null}
        </Pressable>
      ) : null}

      {luggage ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => setLuggageExpanded((current) => !current)}
          accessibilityRole="button"
          accessibilityState={{ expanded: luggageExpanded }}
          accessibilityLabel={
            luggageExpanded
              ? t('dashboard.listings.detail.showLess')
              : t('dashboard.listings.detail.showMore')
          }
        >
          <SectionHeader
            icon="suitcase"
            title={t('trips.create.luggageTitle')}
            meta={luggageTotalsMeta(luggage, t)}
            right={
              <FontAwesome
                name={luggageExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.text.tertiary}
              />
            }
          />
          {luggageExpanded ? (
            <View style={styles.luggageRows}>
              <View style={styles.luggageRow}>
                <AppText style={styles.eyebrow}>{t('trips.create.luggageChoiceLabel')}</AppText>
                <AppText weight="semibold" style={styles.luggageValue}>
                  {luggage.option === 'handCarry'
                    ? t('trips.create.luggageHandCarry')
                    : t('trips.create.luggageChecked')}
                </AppText>
              </View>

              {luggage.option === 'checked'
                ? (luggage.items?.length
                    ? luggage.items
                    : [
                        {
                          type: luggage.type,
                          lengthCm: luggage.lengthCm,
                          widthCm: luggage.widthCm,
                          weightKg: luggage.weightKg,
                        },
                      ]
                  ).map((piece, index) => (
                    <View key={`luggage-piece-${index}`}>
                      <AppText weight="semibold" style={styles.luggageValue}>
                        {piece.type
                          ? t(LUGGAGE_TYPE_LABEL_KEYS[piece.type])
                          : t('trips.create.luggageNew')}
                      </AppText>
                      {piece.lengthCm != null || piece.widthCm != null ? (
                        <View style={styles.luggageRow}>
                          <AppText style={styles.eyebrow}>
                            {t('dashboard.listings.detail.luggageDimensions')}
                          </AppText>
                          <AppText weight="semibold" style={styles.luggageValue}>
                            {[piece.lengthCm, piece.widthCm]
                              .filter((value): value is number => value != null)
                              .join(' × ')}{' '}
                            {t('dashboard.listings.detail.luggageCm')}
                          </AppText>
                        </View>
                      ) : null}
                      {piece.weightKg != null ? (
                        <View style={styles.luggageRow}>
                          <AppText style={styles.eyebrow}>{t('trips.create.luggageWeight')}</AppText>
                          <AppText weight="semibold" style={styles.luggageValue}>
                            {piece.weightKg} {t('dashboard.listings.detail.luggageKg')}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          ) : null}
        </Pressable>
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
              {showDepartureBlock ? (
                <View style={styles.endpointBlock}>
                  {fromCity ? (
                    <View style={styles.endpointTop}>
                      <View style={styles.endpointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.departure')}</AppText>
                        <AppText weight="bold" style={styles.endpointCity}>
                          {fromCity}
                        </AppText>
                      </View>
                      {departureWhen !== undefined ? (
                        <View style={styles.endpointWhen}>
                          <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                          <View style={styles.endpointWhenCopy}>
                            <AppText style={styles.whenLabel}>
                              {t('trips.create.departureDateTime')}
                            </AppText>
                            <AppText weight="semibold" style={styles.whenValue}>
                              {departureWhen}
                            </AppText>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <LocationPointRow
                    eyebrow={t('trips.create.pickupPoint')}
                    point={departurePoint}
                    accessibilityLabel={t('dashboard.listings.detail.openPickupInMaps', {
                      place: departurePoint?.label ?? '—',
                    })}
                  />
                </View>
              ) : null}

              {showArrivalBlock ? (
                <View style={styles.endpointBlock}>
                  {toCity ? (
                    <View style={styles.endpointTop}>
                      <View style={styles.endpointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.arrival')}</AppText>
                        <AppText weight="bold" style={styles.endpointCity}>
                          {toCity}
                        </AppText>
                      </View>
                      {arrivalWhen !== undefined ? (
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
                    point={arrivalPoint}
                    accessibilityLabel={t('dashboard.listings.detail.openDropoffInMaps', {
                      place: arrivalPoint?.label ?? '—',
                    })}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      <OfferVehicleDetailSheet
        visible={vehicleSheetOpen}
        vehicle={listingVehicle}
        onClose={() => setVehicleSheetOpen(false)}
      />
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
  cardPressed: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: 2,
  },
  sectionMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  luggageRows: {
    gap: spacing.xs,
  },
  luggageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  luggageValue: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.text.primary,
    textAlign: 'right',
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
    gap: spacing.xxl,
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
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  pointValueLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
