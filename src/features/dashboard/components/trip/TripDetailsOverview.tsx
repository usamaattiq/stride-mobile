import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TripLocationPoint } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { useResolvedLocationPointLabel } from '@/shared/hooks/useResolvedLocationPointLabel';
import { openInGoogleMaps } from '@/shared/utils/open-in-google-maps';
import { colors, radius, spacing } from '@/theme';

export type TripDetailsOverviewProps = {
  description?: string | null;
  fromCity?: string | null;
  toCity?: string | null;
  /** When omitted, the departure schedule row is hidden. */
  departureWindow?: string;
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
      <FontAwesome name={name} size={14} color={colors.primary} />
    </View>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  right?: React.ReactNode;
};

function SectionHeader({ icon, title, right }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      {right ?? null}
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

export function TripDetailsOverview({
  description,
  fromCity,
  toCity,
  departureWindow,
  arrivalWhen,
  departurePoint,
  arrivalPoint,
}: TripDetailsOverviewProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

  React.useEffect(() => {
    setDescriptionExpanded(false);
  }, [description]);

  const showDetails =
    Boolean(fromCity) ||
    Boolean(toCity) ||
    departureWindow !== undefined ||
    arrivalWhen !== undefined ||
    Boolean(departurePoint) ||
    Boolean(arrivalPoint);

  const showDepartureBlock =
    Boolean(fromCity) || departureWindow !== undefined || Boolean(departurePoint);
  const showArrivalBlock =
    Boolean(toCity) || arrivalWhen !== undefined || Boolean(arrivalPoint);

  return (
    <View style={styles.root}>
      {description ? (
        <View style={styles.card}>
          <SectionHeader
            icon="align-left"
            title={t('dashboard.listings.detail.description')}
            right={
              <Pressable
                onPress={() => setDescriptionExpanded((current) => !current)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  descriptionExpanded
                    ? t('dashboard.listings.detail.showLess')
                    : t('dashboard.listings.detail.showMore')
                }
              >
                <FontAwesome
                  name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.text.tertiary}
                />
              </Pressable>
            }
          />
          {descriptionExpanded ? (
            <AppText style={styles.descriptionText}>{description}</AppText>
          ) : null}
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
                      {departureWindow !== undefined ? (
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
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
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
