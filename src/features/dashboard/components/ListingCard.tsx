import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { i18n as appI18n } from '@/i18n';
import type { RfqOfferStatus, RfqStatusValue } from '@/services/api/rfqApi.types';
import { AppText } from '@/shared/components/AppText';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_ICONS, VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import type { VehicleClass } from '../types/vehicle.types';
import { formatDateRangeLabel } from './trip/dateRangeUtils';
import type { Trip } from '../types/trip.types';

function formatTripWhen(trip: Trip, locale: string): string {
  if (trip.departureUntil) {
    return formatDateRangeLabel(trip.departureAt, trip.departureUntil, locale, trip.departureAt);
  }
  const date = new Date(trip.departureAt);
  if (Number.isNaN(date.getTime())) {
    return trip.departureAt;
  }
  const latinLocale = withLatinDigitsLocale(locale);
  const day = date.toLocaleDateString(latinLocale, {
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString(latinLocale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}

const RFQ_STATUS_TONE: Record<RfqStatusValue, 'green' | 'blue' | 'muted'> = {
  live: 'green',
  'awaiting-confirmation': 'blue',
  'offer-submitted': 'green',
  'awaiting-your-confirmation': 'blue',
  confirmed: 'blue',
  completed: 'blue',
  closed: 'muted',
  expired: 'muted',
};

const OFFER_STATUS_TONE: Record<RfqOfferStatus, 'green' | 'blue' | 'muted'> = {
  active: 'green',
  selected: 'blue',
  confirmed: 'blue',
  withdrawn: 'muted',
  declined: 'muted',
  timed_out: 'muted',
  lapsed: 'muted',
};

function getExpiresAt(trip: Trip): number {
  return new Date(trip.publishedAt).getTime() + trip.durationHours * 60 * 60 * 1000;
}

function formatCountdown(remainingMs: number, t: TFunction): string {
  const totalMinutes = Math.max(1, Math.floor(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return t('dashboard.listings.card.timerHours', { hours, minutes });
  }
  return t('dashboard.listings.card.timerMinutes', { minutes });
}

function RequestThumbnail({
  vehicleClass,
  seatsCount,
}: {
  vehicleClass: VehicleClass | null;
  seatsCount: number | null;
}): React.ReactElement {
  const iconName = vehicleClass ? VEHICLE_CLASS_ICONS[vehicleClass] : 'car';

  return (
    <LinearGradient
      colors={['#FFF8F7', '#FEE4E2', '#F9C6C0']}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.requestThumb}
    >
      <View style={styles.requestThumbIconWell}>
        <FontAwesome5 name={iconName} size={24} color={colors.primary} solid />
      </View>

      {seatsCount != null ? (
        <View style={styles.requestThumbSeats}>
          <FontAwesome name="user" size={7} color={colors.white} />
          <AppText weight="semibold" style={styles.requestThumbSeatsText}>
            {seatsCount}
          </AppText>
        </View>
      ) : null}
    </LinearGradient>
  );
}

export type ListingCardProps = {
  trip: Trip;
  onPress?: () => void;
  onRemovePress?: () => void;
  /** Photo count badge on the thumbnail. Off for My Listings list. */
  showPhotoCount?: boolean;
  /** Shows "Pending" / "Not started yet" instead of the real active/countdown timer. For the unpublished trip preview. */
  pending?: boolean;
};

export function ListingCard({
  trip,
  onPress,
  onRemovePress,
  showPhotoCount = false,
  pending = false,
}: ListingCardProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fromCity = cityDisplayName(trip.departureCity.label);
  const toCity = cityDisplayName(trip.arrivalCity.label);
  const classLabel = trip.vehicleClass
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === trip.vehicleClass)?.labelKey ??
          'vehicles.classPlaceholder',
      )
    : null;
  const seatsLabel =
    trip.vehicleTotalSeats != null
      ? t('vehicles.seatsCount', { count: trip.vehicleTotalSeats })
      : null;
  const modeLabel =
    trip.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : trip.vehicleMode === 'shared'
        ? t('trips.create.vehicleModeShared')
        : null;
  const remainingMs = getExpiresAt(trip) - now;
  const active = remainingMs > 0;
  const timerLabel = active ? formatCountdown(remainingMs, t) : t('dashboard.listings.card.ended');
  const badgeState = pending
    ? 'pending'
    : trip.myOfferStatus
      ? 'myOfferStatus'
      : trip.rfqStatus
        ? 'rfqStatus'
        : active
          ? 'active'
          : 'ended';
  const badgeTone = pending
    ? 'muted'
    : trip.myOfferStatus
      ? OFFER_STATUS_TONE[trip.myOfferStatus]
      : trip.rfqStatus
        ? RFQ_STATUS_TONE[trip.rfqStatus]
        : active
          ? 'green'
          : 'muted';
  const photoTotal = Math.max(trip.vehiclePhotoCount, trip.vehiclePhotoUrl ? 1 : 0);
  const galleryImages = trip.vehiclePhotoUrls.length
    ? trip.vehiclePhotoUrls
    : trip.vehiclePhotoUrl
      ? [trip.vehiclePhotoUrl]
      : [];
  const [galleryVisible, setGalleryVisible] = React.useState(false);
  const offerPrice = trip.myOfferPrice?.trim() || null;
  const price =
    offerPrice ?? (trip.vehicleId != null ? trip.startingPrice?.trim() || null : null);
  const isPassengerRequest = trip.vehicleId == null;
  const showCountdown = !trip.rfqStatus && !trip.myOfferStatus && (pending || active);
  const listingLabel =
    trip.listingType === 'auction'
      ? t('trips.create.listingAuction')
      : t('trips.create.listingRfq');
  const paymentLabel =
    trip.paymentMethod === 'online'
      ? t('trips.create.paymentOnline')
      : trip.paymentMethod === 'both'
        ? t('trips.create.paymentBoth')
        : trip.paymentMethod === 'cash'
          ? t('trips.create.paymentCash')
          : t('trips.create.notSpecified');

  const content = (
    <>
      <LinearGradient
        colors={['#FFFFFF', '#FFF7F6', '#FEE4E2']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(254, 228, 226, 0)', 'rgba(254, 228, 226, 0.55)', 'rgba(253, 210, 207, 0.7)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.35, y: 0.15 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWash}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <View style={styles.topBadges}>
          <View style={styles.topBadge}>
            <FontAwesome name="list-ul" size={9} color={colors.primary} />
            <AppText weight="semibold" style={styles.topBadgeText} numberOfLines={1}>
              {listingLabel}
            </AppText>
          </View>
          <View style={styles.topBadge}>
            <FontAwesome name="credit-card" size={9} color={colors.primary} />
            <AppText weight="semibold" style={styles.topBadgeText} numberOfLines={1}>
              {paymentLabel}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.timerBadge,
            badgeTone === 'blue' && styles.timerBadgeBlue,
            badgeTone === 'muted' && styles.timerBadgeEnded,
          ]}
        >
          <FontAwesome
            name={badgeTone === 'blue' ? 'check-circle' : 'clock-o'}
            size={10}
            color={
              badgeTone === 'green'
                ? colors.accent.green.text
                : badgeTone === 'blue'
                  ? colors.accent.blue.text
                  : colors.text.secondary
            }
          />
          <AppText
            weight="semibold"
            style={[
              styles.timerText,
              badgeTone === 'blue' && styles.timerTextBlue,
              badgeTone === 'muted' && styles.timerTextEnded,
            ]}
            numberOfLines={1}
          >
            {badgeState === 'pending'
              ? t('dashboard.listings.card.pending')
              : badgeState === 'myOfferStatus'
                ? t(`dashboard.listings.detail.responses.offerStatus.${trip.myOfferStatus}`)
                : badgeState === 'rfqStatus'
                  ? t(`dashboard.listings.card.status.${trip.rfqStatus}`)
                  : badgeState === 'active'
                    ? t('dashboard.listings.card.active')
                    : t('dashboard.listings.card.ended')}
          </AppText>
        </View>
      </View>

      <View style={styles.mainRow}>
        <Pressable
          style={styles.thumbnail}
          disabled={!galleryImages.length}
          onPress={() => setGalleryVisible(true)}
          accessibilityRole={galleryImages.length ? 'button' : undefined}
          accessibilityLabel={t('dashboard.listings.card.viewPhotos')}
        >
          {trip.vehiclePhotoUrl ? (
            <Image
              source={{ uri: trip.vehiclePhotoUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          ) : isPassengerRequest ? (
            <RequestThumbnail
              vehicleClass={trip.vehicleClass}
              seatsCount={trip.vehicleTotalSeats}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <FontAwesome name="car" size={18} color={colors.text.tertiary} />
            </View>
          )}
          {showPhotoCount && photoTotal > 1 ? (
            <View style={styles.photoBadge}>
              <FontAwesome name="image" size={9} color={colors.white} />
              <AppText weight="semibold" style={styles.photoBadgeText}>
                {t('dashboard.listings.card.photoCount', {
                  current: 1,
                  total: photoTotal,
                })}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <View style={styles.routeRow}>
              <AppText weight="bold" style={styles.routeCity} numberOfLines={1}>
                {fromCity}
              </AppText>
              <FontAwesome name="long-arrow-right" size={12} color={colors.primary} />
              <AppText weight="bold" style={styles.routeCity} numberOfLines={1}>
                {toCity}
              </AppText>
            </View>
            {onRemovePress ? (
              <Pressable
                onPress={onRemovePress}
                style={styles.removeButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.listings.remove.a11y')}
              >
                <FontAwesome name="trash-o" size={14} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <FontAwesome name="calendar" size={11} color={colors.primary} />
            <AppText style={styles.metaText} numberOfLines={1}>
              {formatTripWhen(trip, i18n.language)}
            </AppText>
          </View>

          <View style={styles.bodyDivider} />

          <View style={styles.detailsPriceRow}>
            <View style={styles.detailsCol}>
              {modeLabel ? (
                <View style={styles.metaRow}>
                  <FontAwesome
                    name={trip.vehicleMode === 'fullPrivate' ? 'lock' : 'users'}
                    size={trip.vehicleMode === 'fullPrivate' ? 14 : 11}
                    color={colors.primary}
                  />
                  <AppText style={styles.metaText} numberOfLines={1}>
                    {modeLabel}
                  </AppText>
                </View>
              ) : null}
              {classLabel || seatsLabel || (!price && showCountdown) ? (
                <View style={styles.vehicleTypeRow}>
                  {classLabel || seatsLabel ? (
                    <View style={[styles.metaRow, styles.vehicleTypeMeta]}>
                      <FontAwesome name="car" size={11} color={colors.primary} />
                      <AppText style={styles.metaText} numberOfLines={1}>
                        {[classLabel, seatsLabel].filter(Boolean).join(' · ')}
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.vehicleTypeMeta} />
                  )}
                  {!price && showCountdown ? (
                    <View style={styles.inlineCountdownBadge}>
                      <FontAwesome name="clock-o" size={10} color={colors.primary} />
                      <AppText weight="semibold" style={styles.countdownText} numberOfLines={1}>
                        {pending ? t('dashboard.listings.card.notStarted') : timerLabel}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            {price ? (
              <View style={styles.priceBlock}>
                <AppText weight="bold" style={styles.priceAmount}>
                  {price}
                </AppText>
                {trip.vehicleMode === 'shared' ? (
                  <AppText style={styles.priceSuffix}>
                    {t('dashboard.listings.pricePerSeatSuffix')}
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {price && showCountdown ? (
        <View style={styles.bottomRow}>
          <View style={styles.countdownBadge}>
            <FontAwesome name="clock-o" size={10} color={colors.primary} />
            <AppText weight="semibold" style={styles.countdownText} numberOfLines={1}>
              {pending ? t('dashboard.listings.card.notStarted') : timerLabel}
            </AppText>
          </View>
        </View>
      ) : null}
    </>
  );

  const item = onPress ? (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={`${fromCity} to ${toCity}`}
    >
      <View style={styles.itemInner}>{content}</View>
    </Pressable>
  ) : (
    <View style={styles.item}>
      <View style={styles.itemInner}>{content}</View>
    </View>
  );

  return (
    <>
      {item}
      <ImageGalleryModal
        visible={galleryVisible}
        images={galleryImages}
        onClose={() => setGalleryVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: radius.md,
    shadowColor: '#B42318',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemInner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  gradientWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '58%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  topBadges: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  topBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.primary,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accent.green.soft,
    flexShrink: 0,
  },
  timerBadgeEnded: {
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  timerBadgeBlue: {
    backgroundColor: colors.accent.blue.soft,
  },
  timerText: {
    fontSize: 11,
    color: colors.accent.green.text,
  },
  timerTextEnded: {
    color: colors.text.secondary,
  },
  timerTextBlue: {
    color: colors.accent.blue.text,
  },
  mainRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  countdownText: {
    fontSize: 11,
    color: colors.primary,
    
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  requestThumbIconWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#7F1D1D',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  requestThumbSeats: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  requestThumbSeatsText: {
    fontSize: 10,
    color: colors.white,
  },
  photoBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  photoBadgeText: {
    fontSize: 10,
    color: colors.white,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  routeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  routeCity: {
    flexShrink: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.text.secondary,
  },
  bodyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 2,
  },
  detailsPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minWidth: 0,
  },
  vehicleTypeMeta: {
    flex: 1,
    minWidth: 0,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  inlineCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  priceAmount: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.primary,
  },
  priceSuffix: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
