import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
import { colors, radius, spacing } from '@/theme';

import { OfferVehicleDetailSheet } from './OfferVehicleDetailSheet';
import { OfferVehicleSummaryCard } from './TripOfferPanel';
import { TripMessagingSheet } from './TripMessagingSheet';
import { WhatsAppContactCard } from './WhatsAppContactCard';

export type TripAuctionBidsPanelProps = {
  tripId: string;
  isPassengerRequest?: boolean;
  onCountChange?: (count: number) => void;
};

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
  const contactTitle = isPassengerRequest
    ? t('dashboard.listings.detail.contact.driverContact')
    : t('dashboard.listings.detail.contact.passengerContact');

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
    if (!snapshot || snapshot.status !== 'live') {
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

  const isAwaiting =
    snapshot.status === 'awaiting_confirmation' || snapshot.status === 'awaiting_action';

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
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
        <Pressable
          onPress={load}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.auctionBids.refresh')}
        >
          <FontAwesome name="refresh" size={16} color={colors.text.tertiary} />
        </Pressable>
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
              snapshot.status === 'live' ||
              (isAwaiting && isSelected) ||
              (isConfirmed && Boolean(row.participantPhone));

            return (
              <View key={row.participantId} style={styles.bidCard}>
                {row.vehicle ? (
                  <OfferVehicleSummaryCard
                    vehicle={row.vehicle}
                    onPress={() => {
                      if (row.vehicle) {
                        setVehicleDetail(row.vehicle);
                      }
                    }}
                  />
                ) : null}
                <View style={styles.bidHeaderRow}>
                  <AppText weight="semibold" style={styles.bidTitle} numberOfLines={1}>
                    {row.participantName?.trim() ||
                      t('dashboard.listings.detail.auctionBids.bidderLabel', {
                        rank: row.rank,
                      })}
                  </AppText>
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
                      weight="semibold"
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
                </View>
                <AppText style={styles.bidAmount}>
                  {t('dashboard.listings.detail.auctionBids.amount', {
                    amount: row.peakAmount,
                  })}
                </AppText>

                {showMessage ? (
                  <WhatsAppContactCard
                    title={contactTitle}
                    name={row.participantName ?? null}
                    phone={row.participantPhone}
                    message={whatsappMessage}
                    onMessagePress={() => setChatTarget(row)}
                  />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
    backgroundColor: colors.background.subtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bidTitle: {
    flex: 1,
    color: colors.text.primary,
  },
  bidAmount: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeSuccess: {
    backgroundColor: colors.accent.green.soft,
  },
  badgeAwaiting: {
    backgroundColor: colors.accent.blue.soft,
  },
  badgeMuted: {
    backgroundColor: colors.background.subtle,
  },
  badgeText: {
    fontSize: 11,
  },
  badgeTextSuccess: {
    color: colors.accent.green.text,
  },
  badgeTextAwaiting: {
    color: colors.accent.blue.text,
  },
  badgeTextMuted: {
    color: colors.text.tertiary,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
  },
});
