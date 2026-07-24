import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import type { Trip } from '../types/trip.types';

function formatTripWhen(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}

function isListingActive(trip: Trip): boolean {
  const expiresAt =
    new Date(trip.publishedAt).getTime() + trip.durationHours * 60 * 60 * 1000;
  return expiresAt > Date.now();
}

export type ListingCardProps = {
  trip: Trip;
  onPress?: () => void;
  onRemovePress?: () => void;
  /** Photo count badge on the thumbnail. Off for My Listings list. */
  showPhotoCount?: boolean;
};

export function ListingCard({
  trip,
  onPress,
  onRemovePress,
  showPhotoCount = false,
}: ListingCardProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });

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
  const active = isListingActive(trip);
  const photoTotal = Math.max(trip.vehiclePhotoCount, trip.vehiclePhotoUrl ? 1 : 0);
  const price = trip.startingPrice?.trim() || null;
  const listingLabel =
    trip.listingType === 'auction'
      ? t('trips.create.listingAuction')
      : t('trips.create.listingRfq');
  const paymentLabel =
    trip.paymentMethod === 'online'
      ? t('trips.create.paymentOnline')
      : trip.paymentMethod === 'cash'
        ? t('trips.create.paymentCash')
        : t('trips.create.notSpecified');

  const content = (
    <>
      <View style={styles.mainRow}>
        <View style={styles.thumbnail}>
          {trip.vehiclePhotoUrl ? (
            <Image
              source={{ uri: trip.vehiclePhotoUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <FontAwesome name="car" size={22} color={colors.text.tertiary} />
            </View>
          )}
          {showPhotoCount && photoTotal > 0 ? (
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
        </View>

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
              {formatTripWhen(trip.departureAt, i18n.language)}
            </AppText>
          </View>

          <View style={styles.bodyDivider} />

          <View style={styles.detailsPriceRow}>
            <View style={styles.detailsCol}>
              {modeLabel ? (
                <View style={styles.metaRow}>
                  <FontAwesome
                    name={trip.vehicleMode === 'fullPrivate' ? 'lock' : 'users'}
                    size={11}
                    color={colors.primary}
                  />
                  <AppText style={styles.metaText} numberOfLines={1}>
                    {modeLabel}
                  </AppText>
                </View>
              ) : null}
              {classLabel || seatsLabel ? (
                <View style={styles.metaRow}>
                  <FontAwesome name="car" size={11} color={colors.primary} />
                  <AppText style={styles.metaText} numberOfLines={1}>
                    {[classLabel, seatsLabel].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
              ) : null}
            </View>

            {price ? (
              <View style={styles.priceBlock}>
                <AppText weight="bold" style={styles.priceAmount}>
                  {price}
                </AppText>
                <AppText style={styles.priceSuffix}>
                  {t('dashboard.listings.pricePerSeatSuffix')}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={styles.footerIcon}>
            <FontAwesome name="list-ul" size={11} color={colors.primary} />
          </View>
          <AppText weight="bold" style={styles.footerPrimary} numberOfLines={1}>
            {listingLabel}
          </AppText>
        </View>

        <View style={styles.footerDivider} />

        <View style={styles.footerItem}>
          <View style={styles.footerIcon}>
            <FontAwesome name="credit-card" size={11} color={colors.primary} />
          </View>
          <AppText weight="semibold" style={styles.footerPlain} numberOfLines={1}>
            {paymentLabel}
          </AppText>
        </View>

        <View style={[styles.statusBadge, !active && styles.statusBadgeEnded]}>
          <FontAwesome
            name="clock-o"
            size={10}
            color={active ? colors.accent.green.text : colors.text.secondary}
          />
          <AppText
            weight="semibold"
            style={[styles.statusText, !active && styles.statusTextEnded]}
          >
            {active
              ? t('dashboard.listings.card.active')
              : t('dashboard.listings.card.ended')}
          </AppText>
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={`${fromCity} to ${toCity}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.item}>{content}</View>;
}

const styles = StyleSheet.create({
  item: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  thumbnail: {
    width: 88,
    height: 96,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
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
    fontSize: 9,
    color: colors.white,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
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
    fontSize: 15,
    color: colors.text.primary,
  },
  removeButton: {
    width: 30,
    height: 30,
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
    gap: 4,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  priceAmount: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.primary,
  },
  priceSuffix: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border.default,
    marginVertical: 2,
  },
  footerIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  footerPrimary: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.primary,
  },
  footerPlain: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.accent.green.soft,
    flexShrink: 0,
  },
  statusBadgeEnded: {
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  statusText: {
    fontSize: 10,
    color: colors.accent.green.text,
  },
  statusTextEnded: {
    color: colors.text.secondary,
  },
});
