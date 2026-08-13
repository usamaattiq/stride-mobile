import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { VehicleListItem } from '@/features/dashboard/components/VehicleListContent';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { auctionApi } from '@/services/api/auctionApi';
import type {
  AuctionBidVehicleSummary,
  AuctionOwnerSnapshot,
  AuctionParticipantRank,
} from '@/services/api/auctionApi.types';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { openWhatsAppChat } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';

import { OfferVehicleDetailSheet } from './OfferVehicleDetailSheet';
import { TripMessagingSheet } from './TripMessagingSheet';

export type TripAuctionBidsPanelProps = {
  tripId: string;
  isPassengerRequest?: boolean;
  onCountChange?: (count: number) => void;
};

function toListVehicle(vehicle: AuctionBidVehicleSummary): Vehicle {
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

export function TripAuctionBidsPanel({
  tripId,
  isPassengerRequest = false,
  onCountChange,
}: TripAuctionBidsPanelProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [snapshot, setSnapshot] = React.useState<AuctionOwnerSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState(false);
  const [vehicleDetail, setVehicleDetail] = React.useState<AuctionBidVehicleSummary | null>(null);
  const [chatTarget, setChatTarget] = React.useState<AuctionParticipantRank | null>(null);

  const whatsappMessage = isPassengerRequest
    ? t('dashboard.listings.detail.contact.messageAsPassenger')
    : t('dashboard.listings.detail.contact.messageAsDriver');

  const applySnapshot = React.useCallback(
    (ownerSnapshot: AuctionOwnerSnapshot) => {
      setSnapshot(ownerSnapshot);
      onCountChange?.(ownerSnapshot.participantCount);
    },
    [onCountChange],
  );

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void auctionApi
      .getSnapshot(tripId)
      .then((result) => {
        applySnapshot(result as AuctionOwnerSnapshot);
      })
      .catch((err) =>
        setError(getErrorMessage(err, t('dashboard.listings.detail.auctionBids.loadFailed'))),
      )
      .finally(() => setLoading(false));
  }, [applySnapshot, t, tripId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!snapshot || snapshot.status.replaceAll('_', '-') !== 'live') {
      return undefined;
    }
    const timer = setInterval(() => {
      void auctionApi
        .getSnapshot(tripId)
        .then((result) => {
          if (result.role === 'owner') {
            applySnapshot(result);
          }
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [applySnapshot, snapshot, tripId]);

  const runOwnerAction = (action: 'selectNext' | 'activate') => {
    setActing(true);
    setError(null);
    const request = action === 'selectNext' ? auctionApi.selectNext : auctionApi.activate;
    void request(tripId)
      .then((result) => applySnapshot(result))
      .catch((err) =>
        setError(getErrorMessage(err, t('dashboard.listings.detail.auctionBids.actionFailed'))),
      )
      .finally(() => setActing(false));
  };

  if (loading && !snapshot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !snapshot) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button label={t('dashboard.listings.detail.auctionBids.retry')} onPress={load} />
      </View>
    );
  }

  if (!snapshot) {
    return <View />;
  }

  const auctionStatus = snapshot.status.replaceAll('_', '-');
  const isLive = auctionStatus === 'live';
  const isAwaiting =
    auctionStatus === 'awaiting-confirmation' || auctionStatus === 'awaiting-action';

  return (
    <View style={styles.root}>
      <View style={styles.headerCopy}>
        <AppText weight="bold" style={styles.headerTitle}>
          {t('dashboard.listings.detail.auctionBids.title')}
        </AppText>
        <AppText style={styles.headerMeta}>
          {snapshot.statusLabel}
          {' · '}
          {snapshot.auctionType === 'reverse'
            ? t('dashboard.listings.detail.bid.lowestWins')
            : t('dashboard.listings.detail.bid.highestWins')}
          {' · '}
          {t('dashboard.listings.detail.auctionBids.currentAmount', {
            amount: snapshot.currentAmount,
          })}
        </AppText>
      </View>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      {snapshot.actions.canActivate || snapshot.actions.canSelectNext ? (
        <View style={styles.actionsRow}>
          {snapshot.actions.canActivate ? (
            <Button
              label={t('dashboard.listings.detail.auctionBids.activate')}
              onPress={() => runOwnerAction('activate')}
              loading={acting}
              style={styles.actionButton}
            />
          ) : null}
          {snapshot.actions.canSelectNext ? (
            <Button
              label={t('dashboard.listings.detail.auctionBids.selectNext')}
              onPress={() => runOwnerAction('selectNext')}
              loading={acting}
              style={styles.actionButton}
            />
          ) : null}
        </View>
      ) : null}

      {snapshot.ranking.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.listings.detail.auctionBids.emptyTitle')}
          </AppText>
          <AppText style={styles.emptyBody}>
            {t('dashboard.listings.detail.auctionBids.emptyBody')}
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {snapshot.ranking.map((row) => {
            const isSelected = row.participantId === snapshot.selectedParticipantId;
            const isConfirmed = row.participantId === snapshot.confirmedParticipantId;
            const showMessage =
              isLive ||
              (isAwaiting && isSelected) ||
              (isConfirmed && Boolean(row.participantPhone));
            const showWhatsApp = Boolean(row.participantPhone?.trim());
            const displayName =
              row.participantName?.trim() ||
              t('dashboard.listings.detail.auctionBids.bidderLabel', {
                rank: row.rank,
              });
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <View
                key={row.participantId}
                style={[
                  styles.bidCard,
                  isConfirmed && styles.bidCardConfirmed,
                  isSelected && !isConfirmed && styles.bidCardSelected,
                  row.rank === 1 && !isSelected && !isConfirmed && styles.bidCardLead,
                ]}
              >
                <View style={styles.bidHeaderRow}>
                  <View
                    style={[
                      styles.badge,
                      isConfirmed
                        ? styles.badgeSuccess
                        : isSelected
                          ? styles.badgeAwaiting
                          : styles.badgeMuted,
                    ]}
                  >
                    <AppText
                      weight="bold"
                      style={[
                        styles.badgeText,
                        isConfirmed
                          ? styles.badgeTextSuccess
                          : isSelected
                            ? styles.badgeTextAwaiting
                            : styles.badgeTextMuted,
                      ]}
                    >
                      {isConfirmed
                        ? t('dashboard.listings.detail.auctionBids.confirmed')
                        : isSelected
                          ? t('dashboard.listings.detail.auctionBids.selected')
                          : t('dashboard.listings.detail.auctionBids.rank', { rank: row.rank })}
                    </AppText>
                  </View>
                  {showMessage ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('dashboard.listings.detail.contact.messageA11y')}
                      onPress={() => setChatTarget(row)}
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
                    <View
                      style={[
                        styles.avatar,
                        isConfirmed && styles.avatarSuccess,
                        isSelected && !isConfirmed && styles.avatarAwaiting,
                      ]}
                    >
                      <AppText
                        weight="bold"
                        style={[
                          styles.avatarInitial,
                          isConfirmed && styles.badgeTextSuccess,
                          isSelected && !isConfirmed && styles.badgeTextAwaiting,
                        ]}
                      >
                        {initial}
                      </AppText>
                    </View>
                    <AppText weight="bold" style={styles.bidTitle} numberOfLines={1}>
                      {displayName}
                    </AppText>
                  </View>
                  <AppText weight="bold" style={styles.bidAmount} numberOfLines={1}>
                    {t('dashboard.listings.detail.auctionBids.amount', {
                      amount: row.peakAmount,
                    })}
                  </AppText>
                </View>

                {row.vehicle ? (
                  <View style={styles.vehicleChip}>
                    <VehicleListItem
                      embedded
                      compact
                      vehicle={toListVehicle(row.vehicle)}
                      onPress={() => {
                        if (row.vehicle) {
                          setVehicleDetail(row.vehicle);
                        }
                      }}
                    />
                  </View>
                ) : null}

                {showWhatsApp ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('dashboard.listings.detail.contact.whatsappA11y', {
                      phone: row.participantPhone,
                    })}
                    onPress={() => {
                      const phone = row.participantPhone?.trim();
                      if (phone) {
                        void openWhatsAppChat(phone, whatsappMessage).catch(() => undefined);
                      }
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
          })}
        </View>
      )}

      <TripMessagingSheet
        visible={chatTarget != null}
        onClose={() => setChatTarget(null)}
        tripId={tripId}
        counterpartyId={chatTarget?.participantId}
        counterpartyName={chatTarget?.participantName ?? null}
        counterpartyRole={isPassengerRequest ? 'driver' : 'passenger'}
      />

      <OfferVehicleDetailSheet
        visible={vehicleDetail != null}
        vehicle={vehicleDetail}
        onClose={() => setVehicleDetail(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.text.primary,
  },
  headerMeta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: '40%',
  },
  emptyCard: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text.primary,
  },
  emptyBody: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  list: {
    gap: spacing.sm,
  },
  bidCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  bidCardLead: {},
  bidCardSelected: {
    backgroundColor: colors.accent.blue.soft,
  },
  bidCardConfirmed: {
    backgroundColor: colors.accent.green.soft,
  },
  bidHeaderRow: {
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
  avatarAwaiting: {
    backgroundColor: colors.white,
  },
  avatarSuccess: {
    backgroundColor: colors.white,
  },
  avatarInitial: {
    fontSize: 13,
    color: colors.primary,
  },
  bidTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
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
  bidAmount: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  vehicleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: radius.sm,
    overflow: 'hidden',
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
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  badgeSuccess: {
    backgroundColor: colors.white,
  },
  badgeAwaiting: {
    backgroundColor: colors.white,
  },
  badgeMuted: {
    backgroundColor: colors.white,
  },
  badgeText: {
    fontSize: 10,
  },
  badgeTextSuccess: {
    color: colors.accent.green.text,
  },
  badgeTextAwaiting: {
    color: colors.accent.blue.text,
  },
  badgeTextMuted: {
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
  },
});
