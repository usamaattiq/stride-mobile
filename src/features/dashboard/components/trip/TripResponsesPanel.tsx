import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { rfqApi } from '@/services/api/rfqApi';
import type { RfqOfferStatus, RfqOfferSummary, RfqOwnerSnapshot } from '@/services/api/rfqApi.types';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import type { TripVehicleMode } from '../../types/trip.types';
import { OfferVehicleSummaryCard } from './TripOfferPanel';

export type TripResponsesPanelProps = {
  tripId: string;
  vehicleMode: TripVehicleMode;
  vehicleTotalSeats: number | null;
  /** Passenger request listings receive offers from drivers. */
  isPassengerRequest?: boolean;
  onCountChange?: (count: number) => void;
};

const BADGE_STYLE_BY_STATUS: Record<RfqOfferStatus, { bg: string; text: string }> = {
  active: { bg: colors.primarySoft, text: colors.primary },
  selected: { bg: colors.primarySoft, text: colors.primary },
  confirmed: { bg: colors.accent.green.soft, text: colors.accent.green.text },
  withdrawn: { bg: colors.background.subtle, text: colors.text.tertiary },
  declined: { bg: colors.background.subtle, text: colors.text.tertiary },
  timed_out: { bg: colors.background.subtle, text: colors.text.tertiary },
  lapsed: { bg: colors.background.subtle, text: colors.text.tertiary },
};

function OfferBadge({ status, label }: { status: RfqOfferStatus; label: string }): React.ReactElement {
  const tone = BADGE_STYLE_BY_STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <AppText weight="semibold" style={[styles.badgeText, { color: tone.text }]}>
        {label}
      </AppText>
    </View>
  );
}

/** Offers arrive newest-first; keep only the latest response per passenger. */
function latestOffersByResponder(offers: RfqOfferSummary[]): RfqOfferSummary[] {
  const seen = new Set<string>();
  const latest: RfqOfferSummary[] = [];
  for (const offer of offers) {
    if (seen.has(offer.responderId)) {
      continue;
    }
    seen.add(offer.responderId);
    latest.push(offer);
  }
  return latest;
}

export function TripResponsesPanel({
  tripId,
  vehicleMode,
  vehicleTotalSeats,
  isPassengerRequest = false,
  onCountChange,
}: TripResponsesPanelProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isFullPrivate = vehicleMode === 'fullPrivate';
  const rejectConfirmBody = isPassengerRequest
    ? t('dashboard.listings.detail.responses.rejectConfirmBodyNotifyDriver')
    : t('dashboard.listings.detail.responses.rejectConfirmBodyNotifyPassenger');
  const [snapshot, setSnapshot] = React.useState<RfqOwnerSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingOfferId, setActingOfferId] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<RfqOfferSummary | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void rfqApi
      .getSnapshot(tripId)
      .then((result) => {
        const ownerSnapshot = result as RfqOwnerSnapshot;
        const offers = latestOffersByResponder(ownerSnapshot.offers);
        setSnapshot({ ...ownerSnapshot, offers });
        onCountChange?.(offers.length);
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.responses.loadFailed'))))
      .finally(() => setLoading(false));
  }, [tripId, t, onCountChange]);

  React.useEffect(() => {
    load();
  }, [load]);

  const statusLabel = (status: RfqOfferStatus): string =>
    t(`dashboard.listings.detail.responses.offerStatus.${status}`);

  const act = (offerId: string, action: 'select' | 'accept' | 'reject') => {
    setActingOfferId(offerId);
    const request =
      action === 'select'
        ? rfqApi.selectOffer
        : action === 'accept'
          ? rfqApi.acceptOffer
          : rfqApi.rejectOffer;
    void request(tripId, offerId)
      .then((result) => {
        const ownerSnapshot = result as RfqOwnerSnapshot;
        const offers = latestOffersByResponder(ownerSnapshot.offers);
        setSnapshot({ ...ownerSnapshot, offers });
        onCountChange?.(offers.length);
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.responses.actionFailed'))))
      .finally(() => {
        setActingOfferId(null);
        setRejectTarget(null);
      });
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
        <Button label={t('dashboard.listings.detail.responses.retry')} onPress={load} />
      </View>
    );
  }

  if (!snapshot) {
    return <View />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <AppText weight="bold" style={styles.headerTitle}>
            {t('dashboard.listings.detail.responses.title')}
          </AppText>
        </View>
        <Pressable
          onPress={load}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.responses.refresh')}
        >
          <FontAwesome name="refresh" size={16} color={colors.text.tertiary} />
        </Pressable>
      </View>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      {snapshot.offers.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.listings.detail.responses.emptyTitle')}
          </AppText>
          <AppText style={styles.emptyBody}>{t('dashboard.listings.detail.responses.emptyBody')}</AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {snapshot.offers.map((offer, index) => {
            const isActing = actingOfferId === offer.id;
            const canDecide = offer.status === 'active' && snapshot.actions.canSelect;
            return (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeaderRow}>
                  <AppText weight="semibold" style={styles.offerTitle} numberOfLines={1}>
                    {offer.responderName?.trim() ||
                      t('dashboard.listings.detail.responses.offerLabel', { index: index + 1 })}
                  </AppText>
                  <OfferBadge status={offer.status} label={statusLabel(offer.status)} />
                </View>

                <View style={styles.offerMetaRow}>
                  {offer.offeredQuantity != null ? (
                    <AppText style={styles.offerMeta}>
                      {t('dashboard.listings.detail.responses.seats', {
                        // Full-private offers hold offeredQuantity=1 (the whole-vehicle
                        // capacity slot) — show the vehicle's real seat count instead.
                        count: isFullPrivate
                          ? (offer.vehicle?.totalSeats ?? vehicleTotalSeats ?? 1)
                          : Number(offer.offeredQuantity),
                      })}
                    </AppText>
                  ) : null}
                  {offer.price != null ? (
                    <AppText weight="semibold" style={styles.offerPrice}>
                      {t('dashboard.listings.card.priceWithCurrency', { price: offer.price })}
                    </AppText>
                  ) : null}
                </View>

                {offer.vehicle ? <OfferVehicleSummaryCard vehicle={offer.vehicle} /> : null}

                {canDecide ? (
                  <View style={styles.offerActions}>
                    <Button
                      label={t('dashboard.listings.detail.responses.reject')}
                      variant="secondary"
                      onPress={() => setRejectTarget(offer)}
                      disabled={isActing}
                      style={styles.offerActionButton}
                    />
                    <Button
                      label={t('dashboard.listings.detail.responses.select')}
                      onPress={() => act(offer.id, 'select')}
                      loading={isActing}
                      disabled={isActing}
                      style={styles.offerActionButton}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <AppDialog
        visible={rejectTarget != null}
        icon="times"
        title={t('dashboard.listings.detail.responses.rejectConfirmTitle')}
        message={rejectConfirmBody}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setRejectTarget(null),
        }}
        confirmAction={{
          label: t('dashboard.listings.detail.responses.reject'),
          onPress: () => {
            if (rejectTarget) {
              act(rejectTarget.id, 'reject');
            }
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  emptyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.xxs,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  offerCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  offerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.text.primary,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
  },
  offerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  offerMeta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  offerPrice: {
    fontSize: 14,
    color: colors.text.primary,
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  offerActionButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
