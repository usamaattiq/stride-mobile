import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VehicleListItem } from '@/features/dashboard/components/VehicleListContent';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { openWhatsAppChat } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';

export type OfferResponseCardTone = 'default' | 'selected' | 'confirmed';

export type OfferResponseTagTone = 'muted' | 'warning' | 'selected' | 'confirmed';

export type OfferVehicleLike = {
  id: string;
  title: string;
  vehicleClass: Vehicle['vehicleClass'];
  totalSeats: number;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  photoUrl: string | null;
  photoViewUrl?: string | null;
  description?: string;
  hasAc?: boolean;
  year?: number | null;
  photoUrls?: string[];
  photoDisplayUris?: string[];
};

export function toListVehicle(vehicle: OfferVehicleLike): Vehicle {
  const photoUris =
    vehicle.photoUrls && vehicle.photoUrls.length > 0
      ? vehicle.photoUrls
      : vehicle.photoUrl
        ? [vehicle.photoUrl]
        : [];
  const photoDisplayUris =
    vehicle.photoDisplayUris && vehicle.photoDisplayUris.length > 0
      ? vehicle.photoDisplayUris
      : vehicle.photoViewUrl
        ? [vehicle.photoViewUrl]
        : photoUris;

  return {
    id: vehicle.id,
    title: vehicle.title,
    description: vehicle.description ?? '',
    plateNumber: vehicle.plateNumber,
    hasAc: vehicle.hasAc ?? false,
    totalSeats: vehicle.totalSeats,
    vehicleClass: vehicle.vehicleClass,
    brand: vehicle.brand ?? '',
    model: vehicle.model ?? '',
    year: vehicle.year != null ? String(vehicle.year) : '',
    photoUris,
    photoDisplayUris,
  };
}

export type OfferResponseCardProps = {
  tag: string;
  tagTone?: OfferResponseTagTone;
  cardTone?: OfferResponseCardTone;
  name: string;
  verified?: boolean;
  priceLabel: string;
  showMessage?: boolean;
  onMessagePress?: () => void;
  vehicle?: OfferVehicleLike | null;
  onVehiclePress?: () => void;
  /** Accept/Reject, or WhatsApp in that same footer slot. */
  footer?: 'decide' | 'whatsapp' | null;
  onReject?: () => void;
  onAccept?: () => void;
  acceptLoading?: boolean;
  actionsDisabled?: boolean;
  whatsappPhone?: string | null;
  whatsappMessage?: string;
};

export function OfferResponseCard({
  tag,
  tagTone = 'muted',
  cardTone = 'default',
  name,
  verified = false,
  priceLabel,
  showMessage = false,
  onMessagePress,
  vehicle,
  onVehiclePress,
  footer = null,
  onReject,
  onAccept,
  acceptLoading = false,
  actionsDisabled = false,
  whatsappPhone,
  whatsappMessage = '',
}: OfferResponseCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const phone = whatsappPhone?.trim() || null;

  return (
    <View
      style={[
        styles.card,
        cardTone === 'selected' && styles.cardSelected,
        cardTone === 'confirmed' && styles.cardConfirmed,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.badge, tagTone === 'warning' && styles.badgeWarning]}>
          <AppText
            weight="bold"
            style={[
              styles.badgeText,
              tagTone === 'confirmed'
                ? styles.badgeTextConfirmed
                : tagTone === 'selected'
                  ? styles.badgeTextSelected
                  : tagTone === 'warning'
                    ? styles.badgeTextWarning
                    : styles.badgeTextMuted,
            ]}
          >
            {tag}
          </AppText>
        </View>
        {showMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.listings.detail.contact.messageA11y')}
            onPress={onMessagePress}
            style={({ pressed }) => [styles.messageChip, pressed && styles.messageChipPressed]}
          >
            <FontAwesome name="comment" size={11} color={colors.primary} />
            <AppText weight="bold" style={styles.messageChipLabel}>
              {t('dashboard.listings.detail.contact.message')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.identityRow}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText
              weight="bold"
              style={[
                styles.avatarInitial,
                cardTone === 'confirmed' && styles.badgeTextConfirmed,
                cardTone === 'selected' && styles.badgeTextSelected,
              ]}
            >
              {initial}
            </AppText>
          </View>
          <AppText weight="bold" style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          {verified ? (
            <FontAwesome
              name="check-circle"
              size={14}
              color="#0095F6"
              accessibilityLabel={t('profile.verification.verified')}
            />
          ) : null}
        </View>
        <AppText weight="bold" style={styles.price} numberOfLines={1}>
          {priceLabel}
        </AppText>
      </View>

      {vehicle ? (
        <View style={styles.vehicleChip}>
          <VehicleListItem
            embedded
            compact
            vehicle={toListVehicle(vehicle)}
            onPress={() => onVehiclePress?.()}
          />
        </View>
      ) : null}

      {footer === 'decide' ? (
        <View style={styles.footerRow}>
          <Button
            label={t('dashboard.listings.detail.responses.reject')}
            variant="secondary"
            onPress={onReject}
            disabled={actionsDisabled}
            style={styles.footerButton}
          />
          <Button
            label={t('dashboard.listings.detail.responses.accept')}
            onPress={onAccept}
            loading={acceptLoading}
            disabled={actionsDisabled}
            style={styles.footerButton}
          />
        </View>
      ) : null}

      {footer === 'whatsapp' && phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.contact.whatsappA11y', { phone })}
          onPress={() => {
            void openWhatsAppChat(phone, whatsappMessage).catch(() => undefined);
          }}
          style={({ pressed }) => [styles.whatsappButton, pressed && styles.whatsappButtonPressed]}
        >
          <FontAwesome5 name="whatsapp" size={16} color="#FFFFFF" />
          <AppText weight="bold" style={styles.whatsappLabel}>
            {t('dashboard.listings.detail.auctionBids.whatsapp')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardSelected: {
    backgroundColor: colors.accent.amber.soft,
  },
  cardConfirmed: {
    backgroundColor: colors.accent.green.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  avatarInitial: {
    fontSize: 13,
    color: colors.primary,
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  price: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  messageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  messageChipPressed: {
    opacity: 0.75,
  },
  messageChipLabel: {
    fontSize: 11,
    color: colors.primary,
  },
  vehicleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  badgeWarning: {
    backgroundColor: colors.accent.amber.soft,
  },
  badgeText: {
    fontSize: 10,
  },
  badgeTextConfirmed: {
    color: colors.accent.green.text,
  },
  badgeTextSelected: {
    color: colors.accent.amber.text,
  },
  badgeTextWarning: {
    color: colors.accent.amber.text,
  },
  badgeTextMuted: {
    color: colors.text.secondary,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  whatsappButton: {
    minHeight: 40,
    borderRadius: radius.full,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  whatsappButtonPressed: {
    opacity: 0.85,
  },
  whatsappLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
