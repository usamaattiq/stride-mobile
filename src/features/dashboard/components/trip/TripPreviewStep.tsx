import React from 'react';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

type TripPreviewStepProps = {
  draft: TripDraft;
  vehicle: Vehicle | undefined;
  onPublish: () => void;
  onEdit: () => void;
  publishing?: boolean;
  errorMessage?: string | null;
};

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
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

function formatDurationLabel(
  hours: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return t('trips.create.durationValue', { count: wholeHours });
  }
  if (wholeHours === 0) {
    return t('trips.create.durationMinutesOnly', { count: minutes });
  }
  return t('trips.create.durationHoursMinutes', {
    hours: wholeHours,
    minutes,
  });
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

type FeatureChipProps = {
  icon: React.ReactNode;
  label: string;
  showDivider?: boolean;
};

function FeatureChip({ icon, label, showDivider = false }: FeatureChipProps): React.ReactElement {
  return (
    <View style={styles.featureChip}>
      {showDivider ? <View style={styles.featureDivider} /> : null}
      <View style={styles.featureInner}>
        {icon}
        <AppText weight="semibold" style={styles.featureLabel} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

type ListingCellProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function ListingCell({ icon, label, value }: ListingCellProps): React.ReactElement {
  return (
    <View style={styles.listingCell}>
      <View style={styles.listingIconWrap}>{icon}</View>
      <View style={styles.listingCopy}>
        <AppText style={styles.listingLabel}>{label}</AppText>
        <AppText weight="bold" style={styles.listingValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function TripPreviewStep({
  draft,
  vehicle,
  onPublish,
  onEdit,
  publishing = false,
  errorMessage = null,
}: TripPreviewStepProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;

  const vehicleModeLabel =
    draft.vehicleMode === 'shared'
      ? t('trips.create.vehicleModeShared')
      : draft.vehicleMode === 'fullPrivate'
        ? t('trips.create.vehicleModeFullPrivate')
        : '—';

  const listingLabel =
    draft.listingType === 'rfq'
      ? t('trips.create.listingRfq')
      : draft.listingType === 'auction'
        ? t('trips.create.listingAuction')
        : '—';

  const paymentLabel =
    draft.paymentMethod === 'cash'
      ? t('trips.create.paymentCash')
      : draft.paymentMethod === 'online'
        ? t('trips.create.paymentOnline')
        : '—';

  const startLabel =
    draft.startMode === 'instant'
      ? t('trips.create.startInstant')
      : draft.startMode === 'scheduled'
        ? formatDateTime(draft.scheduledStartAt, locale)
        : '—';

  const priceLabel = draft.startingPrice.trim()
    ? draft.startingPrice.trim()
    : t('trips.create.notSpecified');

  const photoUri = vehicle?.photoDisplayUris?.[0] ?? vehicle?.photoUris[0];
  const departureCity = draft.departureCity
    ? cityDisplayName(draft.departureCity.label)
    : '—';
  const arrivalCity = draft.arrivalCity ? cityDisplayName(draft.arrivalCity.label) : '—';

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.vehicleTop}>
          <View style={styles.vehicleCopy}>
            <View style={styles.cardHeader}>
              <SectionIcon name="car" />
              <View style={styles.cardHeaderCopy}>
                <AppText style={styles.eyebrow}>{t('trips.create.previewVehicle')}</AppText>
                <AppText weight="bold" style={styles.cardTitle} numberOfLines={2}>
                  {vehicle?.title ?? '—'}
                </AppText>
              </View>
            </View>

            <View style={styles.featuresRow}>
              <FeatureChip
                icon={<FontAwesome name="user" size={11} color={colors.text.secondary} />}
                label={
                  vehicle
                    ? t('vehicles.seatsCount', { count: vehicle.totalSeats })
                    : '—'
                }
              />
              <FeatureChip
                showDivider
                icon={
                  <MaterialCommunityIcons
                    name="snowflake"
                    size={12}
                    color={colors.text.secondary}
                  />
                }
                label={
                  vehicle?.hasAc
                    ? t('trips.create.acAvailable')
                    : t('vehicles.fields.acOff')
                }
              />
            </View>
          </View>

          <View style={styles.vehicleThumb}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.vehicleThumbImage} contentFit="cover" />
            ) : (
              <View style={styles.vehicleThumbFallback}>
                <FontAwesome name="car" size={22} color={colors.text.tertiary} />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SectionIcon name="car" />
          <View style={styles.cardHeaderCopy}>
            <AppText style={styles.eyebrow}>{t('trips.create.vehicleModeLabel')}</AppText>
            <AppText weight="bold" style={styles.cardTitle}>
              {vehicleModeLabel}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SectionIcon name="map-marker" />
          <AppText weight="bold" style={styles.sectionTitle}>
            {t('trips.create.detailsTitle')}
          </AppText>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineRail}>
            <View style={[styles.timelineDot, styles.timelineDotStart]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.timelineDotEnd]} />
          </View>

          <View style={styles.timelineBody}>
            <View style={styles.endpointBlock}>
              <View style={styles.endpointTop}>
                <View style={styles.endpointCopy}>
                  <AppText style={styles.eyebrow}>{t('trips.create.departure')}</AppText>
                  <AppText weight="bold" style={styles.endpointCity}>
                    {departureCity}
                  </AppText>
                </View>
                <View style={styles.endpointWhen}>
                  <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                  <View style={styles.endpointWhenCopy}>
                    <AppText style={styles.whenLabel}>
                      {t('trips.create.departureDateTime')}
                    </AppText>
                    <AppText weight="semibold" style={styles.whenValue}>
                      {formatDateTime(draft.departureAt, locale)}
                    </AppText>
                  </View>
                </View>
              </View>
              <View style={styles.pointRow}>
                <FontAwesome name="map-marker" size={12} color={colors.primary} />
                <View style={styles.pointCopy}>
                  <AppText style={styles.eyebrow}>{t('trips.create.pickupPoint')}</AppText>
                  <AppText weight="medium" style={styles.pointValue}>
                    {draft.departurePoint?.label ?? '—'}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.endpointBlock}>
              <View style={styles.endpointTop}>
                <View style={styles.endpointCopy}>
                  <AppText style={styles.eyebrow}>{t('trips.create.arrival')}</AppText>
                  <AppText weight="bold" style={styles.endpointCity}>
                    {arrivalCity}
                  </AppText>
                </View>
                <View style={styles.endpointWhen}>
                  <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                  <View style={styles.endpointWhenCopy}>
                    <AppText style={styles.whenLabel}>
                      {t('trips.create.arrivalDateTime')}
                    </AppText>
                    <AppText weight="semibold" style={styles.whenValue}>
                      {formatDateTime(draft.arrivalAt, locale)}
                    </AppText>
                  </View>
                </View>
              </View>
              <View style={styles.pointRow}>
                <FontAwesome name="map-marker" size={12} color={colors.primary} />
                <View style={styles.pointCopy}>
                  <AppText style={styles.eyebrow}>{t('trips.create.dropoffPoint')}</AppText>
                  <AppText weight="medium" style={styles.pointValue}>
                    {draft.arrivalPoint?.label ?? '—'}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SectionIcon name="tag" />
          <AppText weight="bold" style={styles.sectionTitle}>
            {t('trips.create.previewListingDetails')}
          </AppText>
        </View>

        <View style={styles.listingGrid}>
          <View style={styles.listingRow}>
            <ListingCell
              icon={<FontAwesome name="list-ul" size={13} color={colors.primary} />}
              label={t('trips.create.listingTypeLabel')}
              value={listingLabel}
            />
            <ListingCell
              icon={<FontAwesome name="clock-o" size={13} color={colors.primary} />}
              label={t('trips.create.durationLabel')}
              value={formatDurationLabel(draft.durationHours, t)}
            />
          </View>
          <View style={styles.listingDivider} />
          <View style={styles.listingRow}>
            <ListingCell
              icon={<FontAwesome name="dollar" size={13} color={colors.primary} />}
              label={t('trips.create.startingPrice')}
              value={priceLabel}
            />
            <ListingCell
              icon={<FontAwesome name="play-circle" size={13} color={colors.primary} />}
              label={t('trips.create.startModeLabel')}
              value={startLabel}
            />
          </View>
          <View style={styles.listingDivider} />
          <View style={styles.listingRow}>
            <ListingCell
              icon={<FontAwesome name="credit-card" size={13} color={colors.primary} />}
              label={t('trips.create.paymentMethodLabel')}
              value={paymentLabel}
            />
            <ListingCell
              icon={<FontAwesome5 name="chair" size={12} color={colors.primary} />}
              label={t('vehicles.fields.totalSeats')}
              value={vehicle ? String(vehicle.totalSeats) : '—'}
            />
          </View>
        </View>
      </View>

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          disabled={publishing}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
            publishing && styles.actionDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('trips.create.editTrip')}
        >
          <FontAwesome name="pencil-square-o" size={16} color={colors.primary} />
          <AppText weight="bold" style={styles.editButtonText}>
            {t('trips.create.editTrip')}
          </AppText>
        </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
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
  eyebrow: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  vehicleTop: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  vehicleThumb: {
    width: 88,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
  },
  vehicleThumbImage: {
    width: '100%',
    height: '100%',
  },
  vehicleThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: colors.border.strong,
    marginRight: spacing.xs,
  },
  featureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureLabel: {
    fontSize: 12,
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
    gap: spacing.md,
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
  listingGrid: {
    gap: 0,
  },
  listingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  listingCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    minWidth: 0,
  },
  listingIconWrap: {
    width: 18,
    alignItems: 'center',
    marginTop: 2,
  },
  listingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listingLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  listingValue: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  editButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  editButtonPressed: {
    backgroundColor: colors.primaryMuted,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  publishButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
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
