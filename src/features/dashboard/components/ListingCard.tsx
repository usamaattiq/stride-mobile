import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { i18n as appI18n } from '@/i18n';
import type { AuctionStatusValue } from '@/services/api/auctionApi.types';
import type { RfqOfferStatus, RfqStatusValue } from '@/services/api/rfqApi.types';
import { AppText } from '@/shared/components/AppText';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { useLocalizedCityName } from '@/shared/hooks/useLocalizedCityName';
import { formatPriceAmount, withLatinDigitsLocale } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

import { getVehicleClassImage, getVehicleClassLabelKey } from '../constants/vehicleClasses';
import type { VehicleClass } from '../types/vehicle.types';
import { formatDateRangeLabel, isMultiDayWindow } from './trip/dateRangeUtils';
import type { Trip } from '../types/trip.types';
import { getListingExpiresAtMs, isListingNotStartedYet } from '../utils/listingWindow';
import { canRepostListing } from '../utils/listingFilters';

function formatTripWhen(trip: Trip, locale: string, openLabel: string): string {
  if (trip.departureOpen) {
    return openLabel;
  }
  if (trip.departureUntil && isMultiDayWindow(trip.departureAt, trip.departureUntil)) {
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

type StatusBadgeTone = 'green' | 'blue' | 'amber' | 'muted';

const RFQ_STATUS_TONE: Record<RfqStatusValue, StatusBadgeTone> = {
  live: 'green',
  'awaiting-confirmation': 'amber',
  'offer-submitted': 'amber',
  'awaiting-your-confirmation': 'amber',
  confirmed: 'green',
  completed: 'blue',
  closed: 'muted',
  expired: 'muted',
};

const AUCTION_STATUS_TONE: Record<AuctionStatusValue, StatusBadgeTone> = {
  'coming-soon': 'blue',
  live: 'green',
  'awaiting-confirmation': 'amber',
  'awaiting-action': 'amber',
  'awaiting-your-confirmation': 'amber',
  declined: 'muted',
  'timed-out': 'muted',
  completed: 'blue',
  closed: 'muted',
  expired: 'muted',
};

const AUCTION_VARIANT_TONE: Record<
  'muted' | 'accent' | 'warning' | 'success',
  StatusBadgeTone
> = {
  muted: 'muted',
  accent: 'green',
  warning: 'amber',
  success: 'green',
};

const OFFER_STATUS_TONE: Record<RfqOfferStatus, StatusBadgeTone> = {
  active: 'amber',
  selected: 'amber',
  confirmed: 'green',
  withdrawn: 'muted',
  declined: 'muted',
  timed_out: 'muted',
  lapsed: 'muted',
};

function formatCountdown(remainingMs: number, t: TFunction): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return t('dashboard.listings.card.timerHours', { hours, minutes });
  }
  return t('dashboard.listings.card.timerMinutesSeconds', { minutes, seconds });
}

function RequestThumbnail({
  vehicleClass,
}: {
  vehicleClass: VehicleClass | null;
}): React.ReactElement {
  const imageSource = getVehicleClassImage(vehicleClass);

  return (
    <View style={styles.requestThumb}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.requestThumbImage}
          contentFit="contain"
        />
      ) : (
        <View style={styles.requestThumbFallback}>
          <FontAwesome name="car" size={22} color={colors.primary} />
        </View>
      )}
    </View>
  );
}

export type ListingCardProps = {
  trip: Trip;
  onPress?: () => void;
  /** Photo count badge on the thumbnail. Off for My Listings list. */
  showPhotoCount?: boolean;
  /** Shows "Pending" / "Coming soon" instead of the real active/countdown timer. For the unpublished trip preview. */
  pending?: boolean;
  /** Owner action: open create-trip prefilled from this completed listing. */
  onRepost?: () => void;
};

export function ListingCard({
  trip,
  onPress,
  showPhotoCount = false,
  pending = false,
  onRepost,
}: ListingCardProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });

  const [now, setNow] = React.useState(() => Date.now());
  const startsLater = !pending && isListingNotStartedYet(trip, now);
  const remainingMs = startsLater ? 0 : getListingExpiresAtMs(trip) - now;
  const tickMs = startsLater ? 15_000 : 30_000;
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const fromCity = useLocalizedCityName(trip.departureCity, trip.departurePoint);
  const toCity = useLocalizedCityName(trip.arrivalCity, trip.arrivalPoint);
  const classLabel = trip.vehicleClass
    ? t(getVehicleClassLabelKey(trip.vehicleClass))
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
  const active = remainingMs > 0;
  const endingSoon = active && remainingMs < 60 * 60_000;
  const timerLabel = !active
    ? t('dashboard.listings.card.ended')
    : endingSoon
      ? t('dashboard.listings.card.endingSoon')
      : formatCountdown(remainingMs, t);
  // Auctions: use AMS display status/label as-is (never remap participant_status → "Bid active").
  const useAuctionTag = trip.listingType === 'auction' && Boolean(trip.auctionStatus);
  const badgeState = pending
    ? 'pending'
    : startsLater
      ? 'notStarted'
      : useAuctionTag
      ? 'auctionStatus'
      : trip.rfqStatus
        ? 'rfqStatus'
        : trip.myOfferStatus
          ? 'myOfferStatus'
          : active
            ? 'active'
            : 'ended';
  const badgeTone = pending
    ? 'muted'
    : startsLater
      ? 'muted'
      : useAuctionTag && trip.auctionStatus
      ? trip.auctionStatusVariant
        ? AUCTION_VARIANT_TONE[trip.auctionStatusVariant]
        : AUCTION_STATUS_TONE[trip.auctionStatus]
      : trip.rfqStatus
        ? RFQ_STATUS_TONE[trip.rfqStatus]
        : trip.myOfferStatus
          ? OFFER_STATUS_TONE[trip.myOfferStatus]
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
  const rawPrice = trip.startingPrice?.trim() || null;
  const stripped = rawPrice?.replace(/^\s*PKR\s*/i, '').trim() || null;
  const price = stripped ? formatPriceAmount(stripped) || null : null;
  const isPassengerRequest = trip.vehicleId == null;
  // Countdown is listing time remaining — hide it until the listing has actually started.
  const isAuction = trip.listingType === 'auction';
  const offerSettled =
    trip.rfqStatus === 'confirmed' ||
    trip.rfqStatus === 'completed' ||
    trip.myOfferStatus === 'confirmed';
  // Auction remaining time lives next to Place your bid, not on the listing card.
  const showCountdown =
    !isAuction && !pending && !startsLater && active && !offerSettled;
  const listingLabel = isAuction
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
  const showRepost = Boolean(onRepost) && !pending && canRepostListing(trip);

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
          <View
            style={[
              styles.topBadge,
              isAuction ? styles.listingBadgeAuction : styles.listingBadgeRfq,
            ]}
          >
            <FontAwesome
              name={isAuction ? 'gavel' : 'list-ul'}
              size={9}
              color={isAuction ? colors.accent.purple.text : colors.accent.blue.text}
            />
            <AppText
              weight="semibold"
              style={[
                styles.topBadgeText,
                isAuction ? styles.listingBadgeTextAuction : styles.listingBadgeTextRfq,
              ]}
              numberOfLines={1}
            >
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
            badgeTone === 'amber' && styles.timerBadgeAmber,
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
                  : badgeTone === 'amber'
                    ? colors.accent.amber.text
                    : colors.text.secondary
            }
          />
          <AppText
            weight="semibold"
            style={[
              styles.timerText,
              badgeTone === 'blue' && styles.timerTextBlue,
              badgeTone === 'amber' && styles.timerTextAmber,
              badgeTone === 'muted' && styles.timerTextEnded,
            ]}
            numberOfLines={1}
          >
            {badgeState === 'pending'
              ? t('dashboard.listings.card.pending')
              : badgeState === 'notStarted'
                ? t('dashboard.listings.card.notStarted')
                : badgeState === 'auctionStatus'
                ? trip.auctionStatusLabel?.trim() ||
                  t(`dashboard.listings.card.auctionStatus.${trip.auctionStatus}`)
                : badgeState === 'rfqStatus'
                  ? t(`dashboard.listings.card.status.${trip.rfqStatus}`)
                  : badgeState === 'myOfferStatus'
                    ? t(`dashboard.listings.detail.responses.offerStatus.${trip.myOfferStatus}`)
                    : badgeState === 'active'
                      ? t('dashboard.listings.card.active')
                      : t('dashboard.listings.card.ended')}
          </AppText>
        </View>
      </View>

      <View style={styles.mainRow}>
        <Pressable
          style={[
            styles.thumbnail,
            isPassengerRequest && !trip.vehiclePhotoUrl && styles.thumbnailRequest,
          ]}
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
            <RequestThumbnail vehicleClass={trip.vehicleClass} />
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
          </View>

          <View style={styles.metaRow}>
            <FontAwesome name="calendar" size={11} color={colors.primary} />
            <AppText style={styles.metaText} numberOfLines={1}>
              {formatTripWhen(trip, i18n.language, t('dashboard.listings.card.open'))}
            </AppText>
          </View>

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
              {classLabel || seatsLabel ? (
                <View style={[styles.metaRow, styles.vehicleTypeMeta]}>
                  <FontAwesome name="car" size={11} color={colors.primary} />
                  <AppText style={styles.metaText} numberOfLines={1}>
                    {[classLabel, seatsLabel].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
              ) : null}
            </View>

            {price ? (
              <View style={styles.priceBlock}>
                <AppText weight="bold" style={styles.priceAmount} numberOfLines={1}>
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

          {showCountdown ? (
            <View style={styles.bodyCountdownRow}>
              <View style={styles.countdownBadge}>
                <FontAwesome name="clock-o" size={10} color={colors.primary} />
                <AppText weight="semibold" style={styles.countdownText} numberOfLines={1}>
                  {pending ? t('dashboard.listings.card.notStarted') : timerLabel}
                </AppText>
              </View>
            </View>
          ) : showRepost ? (
            <View style={styles.bodyCountdownRow}>
              <Pressable
                onPress={onRepost}
                hitSlop={6}
                style={({ pressed }) => [styles.repostChip, pressed && styles.repostChipPressed]}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.listings.card.repost')}
              >
                <FontAwesome name="repeat" size={10} color={colors.white} />
                <AppText weight="semibold" style={styles.repostChipText} numberOfLines={1}>
                  {t('dashboard.listings.card.repost')}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
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
      <View style={styles.shadowGutter}>{item}</View>
      <ImageGalleryModal
        visible={galleryVisible}
        images={galleryImages}
        onClose={() => setGalleryVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  item: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  itemInner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  repostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  repostChipPressed: {
    opacity: 0.88,
  },
  repostChipText: {
    fontSize: 11,
    color: colors.white,
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
    paddingHorizontal: spacing.xs,
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
  listingBadgeRfq: {
    backgroundColor: colors.accent.blue.soft,
  },
  listingBadgeAuction: {
    backgroundColor: colors.accent.purple.soft,
  },
  topBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.primary,
  },
  listingBadgeTextRfq: {
    color: colors.accent.blue.text,
  },
  listingBadgeTextAuction: {
    color: colors.accent.purple.text,
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
  timerBadgeAmber: {
    backgroundColor: colors.accent.amber.soft,
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
  timerTextAmber: {
    color: colors.accent.amber.text,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
  thumbnailRequest: {
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  requestThumbImage: {
    width: '100%',
    height: '100%',
  },
  requestThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  vehicleTypeMeta: {
    flex: 1,
    minWidth: 0,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 64,
    paddingTop: 2,
  },
  bodyCountdownRow: {
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 22,
    lineHeight: 32,
    color: colors.primary,
  },
  priceSuffix: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
