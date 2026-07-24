import React from 'react';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { canPublishTripDraft, type TripDraft } from '@/features/dashboard/types/trip.types';
import { formatDateRangeLabel } from '@/features/dashboard/components/trip/dateRangeUtils';
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

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  editA11yLabel: string;
};

function SectionHeader({
  icon,
  title,
  subtitle,
  onEdit,
  editA11yLabel,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        {subtitle ? <AppText style={styles.eyebrow}>{subtitle}</AppText> : null}
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={styles.editIconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={editA11yLabel}
        >
          <FontAwesome name="pencil" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
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
  onEditStep,
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
        : t('trips.create.notSpecified');

  const listingLabel =
    draft.listingType === 'rfq'
      ? t('trips.create.listingRfq')
      : draft.listingType === 'auction'
        ? t('trips.create.listingAuction')
        : t('trips.create.notSpecified');

  const paymentLabel =
    draft.paymentMethod === 'cash'
      ? t('trips.create.paymentCash')
      : draft.paymentMethod === 'online'
        ? t('trips.create.paymentOnline')
        : t('trips.create.notSpecified');

  const startLabel =
    draft.startMode === 'instant'
      ? t('trips.create.startInstant')
      : draft.startMode === 'scheduled'
        ? formatDateTime(draft.scheduledStartAt, locale)
        : t('trips.create.notSpecified');

  const priceLabel = draft.startingPrice.trim()
    ? draft.startingPrice.trim()
    : t('trips.create.notSpecified');

  const photoUri = vehicle?.photoDisplayUris?.[0] ?? vehicle?.photoUris[0];
  const departureCity = draft.departureCity
    ? cityDisplayName(draft.departureCity.label)
    : '—';
  const arrivalCity = draft.arrivalCity ? cityDisplayName(draft.arrivalCity.label) : '—';
  const canPublish = canPublishTripDraft(draft);
  const editA11y = t('dashboard.listings.detail.edit');

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <SectionHeader
          icon="car"
          subtitle={t('trips.create.vehicleTitle')}
          title={vehicle?.title ?? '—'}
          onEdit={() => onEditStep('vehicle')}
          editA11yLabel={editA11y}
        />
        <View style={styles.vehicleBody}>
          <View style={styles.vehicleCopy}>
            <View style={styles.featuresRow}>
              <FeatureChip
                icon={<FontAwesome name="user" size={11} color={colors.text.secondary} />}
                label={
                  vehicle ? t('vehicles.seatsCount', { count: vehicle.totalSeats }) : '—'
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
                  vehicle?.hasAc ? t('trips.create.acAvailable') : t('vehicles.fields.acOff')
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
        <SectionHeader
          icon="exchange"
          subtitle={t('trips.create.vehicleModeTitle')}
          title={vehicleModeLabel}
          onEdit={() => onEditStep('vehicleMode')}
          editA11yLabel={editA11y}
        />
      </View>

      <View style={styles.card}>
        <SectionHeader
          icon="map-marker"
          title={t('trips.create.detailsTitle')}
          onEdit={() => onEditStep('details')}
          editA11yLabel={editA11y}
        />

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
                      {t('trips.create.departureDateWindow')}
                    </AppText>
                    <AppText weight="semibold" style={styles.whenValue}>
                      {formatDateRangeLabel(
                        draft.departureAt,
                        draft.departureUntil,
                        locale,
                        '—',
                      )}
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
        <SectionHeader
          icon="tag"
          title={t('trips.create.listingTitle')}
          onEdit={() => onEditStep('listing')}
          editA11yLabel={editA11y}
        />

        <View style={styles.listingGrid}>
          <View style={styles.listingRow}>
            <ListingCell
              icon={<FontAwesome name="list-ul" size={13} color={colors.primary} />}
              label={t('trips.create.listingTypeLabel')}
              value={listingLabel}
            />
            <ListingCell
              icon={<FontAwesome name="dollar" size={13} color={colors.primary} />}
              label={t('trips.create.startingPrice')}
              value={priceLabel}
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
              icon={<FontAwesome name="clock-o" size={13} color={colors.primary} />}
              label={t('trips.create.durationLabel')}
              value={formatDurationLabel(draft.durationHours, t)}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <SectionHeader
          icon="play-circle"
          subtitle={t('trips.create.scheduleTitle')}
          title={startLabel}
          onEdit={() => onEditStep('schedule')}
          editA11yLabel={editA11y}
        />
      </View>

      <View style={styles.card}>
        <SectionHeader
          icon="align-left"
          title={t('dashboard.listings.detail.description')}
          onEdit={() => onEditStep('details')}
          editA11yLabel={editA11y}
        />
        <AppText style={styles.descriptionText}>
          {draft.description.trim()
            ? draft.description.trim()
            : t('dashboard.listings.detail.descriptionBody', {
                from: departureCity,
                to: arrivalCity,
                vehicle: vehicle?.title ?? '—',
                mode: vehicleModeLabel,
              })}
        </AppText>
      </View>

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
      {!canPublish && !errorMessage ? (
        <AppText style={styles.errorText}>{t('trips.create.publishIncomplete')}</AppText>
      ) : null}

      <Pressable
        onPress={onPublish}
        disabled={publishing || !canPublish}
        style={({ pressed }) => [
          styles.publishButton,
          pressed && canPublish && !publishing && styles.publishButtonPressed,
          (publishing || !canPublish) && styles.actionDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('trips.create.publish')}
        accessibilityState={{ busy: publishing, disabled: publishing || !canPublish }}
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
  editIconButton: {
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
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  vehicleBody: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
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
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
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
