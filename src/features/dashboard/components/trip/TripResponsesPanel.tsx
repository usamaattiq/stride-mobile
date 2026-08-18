import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { rfqApi } from '@/services/api/rfqApi';
import type { RfqOfferStatus, RfqOfferSummary, RfqOfferVehicleSummary, RfqOwnerSnapshot } from '@/services/api/rfqApi.types';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { buildWhatsAppContactMessage } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';

import { useDashboardSession } from '../../context/DashboardSessionContext';
import type { TripVehicleMode } from '../../types/trip.types';
import { isTerminalListingStatus } from '../../utils/listingFilters';
import { OfferResponseCard, type OfferResponseTagTone } from './OfferResponseCard';
import { OfferVehicleDetailSheet } from './OfferVehicleDetailSheet';
import { TripMessagingSheet } from './TripMessagingSheet';

export type TripResponsesPanelProps = {
  tripId: string;
  routeLabel: string;
  vehicleMode: TripVehicleMode;
  vehicleTotalSeats: number | null;
  /** Passenger request listings receive offers from drivers. */
  isPassengerRequest?: boolean;
  onCountChange?: (count: number) => void;
  onRfqStatusChange?: (status: RfqOwnerSnapshot['status']) => void;
};

const TAG_TONE_BY_STATUS: Record<RfqOfferStatus, OfferResponseTagTone> = {
  active: 'warning',
  selected: 'selected',
  confirmed: 'confirmed',
  withdrawn: 'muted',
  declined: 'muted',
  timed_out: 'muted',
  lapsed: 'muted',
};

function ownerListingRfqStatus(snapshot: RfqOwnerSnapshot): RfqOwnerSnapshot['status'] {
  if (snapshot.status === 'live' && snapshot.offers.some((offer) => offer.status === 'confirmed')) {
    return 'confirmed';
  }
  return snapshot.status;
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
  routeLabel,
  vehicleMode,
  vehicleTotalSeats,
  isPassengerRequest = false,
  onCountChange,
  onRfqStatusChange,
}: TripResponsesPanelProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const rejectConfirmBody = isPassengerRequest
    ? t('dashboard.listings.detail.responses.rejectConfirmBodyNotifyDriver')
    : t('dashboard.listings.detail.responses.rejectConfirmBodyNotifyPassenger');
  // Owner messaging the responder: passenger request → owner is passenger; else driver.
  const whatsappMessage = buildWhatsAppContactMessage(t, {
    asDriver: !isPassengerRequest,
    name: user.fullName,
    route: routeLabel,
    requestId: tripId,
  });
  const [snapshot, setSnapshot] = React.useState<RfqOwnerSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingOfferId, setActingOfferId] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<RfqOfferSummary | null>(null);
  const [vehicleDetail, setVehicleDetail] = React.useState<RfqOfferVehicleSummary | null>(null);
  const [chatTarget, setChatTarget] = React.useState<RfqOfferSummary | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void rfqApi
      .getSnapshot(tripId)
      .then((result) => {
        const ownerSnapshot = result as RfqOwnerSnapshot;
        const offers = latestOffersByResponder(ownerSnapshot.offers);
        const next = { ...ownerSnapshot, offers };
        setSnapshot(next);
        onCountChange?.(offers.length);
        onRfqStatusChange?.(ownerListingRfqStatus(next));
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.responses.loadFailed'))))
      .finally(() => setLoading(false));
  }, [tripId, t, onCountChange, onRfqStatusChange]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!snapshot || isTerminalListingStatus(snapshot.status)) {
      return undefined;
    }
    const timer = setInterval(() => {
      void rfqApi
        .getSnapshot(tripId)
        .then((result) => {
          const ownerSnapshot = result as RfqOwnerSnapshot;
          const offers = latestOffersByResponder(ownerSnapshot.offers);
          const next = { ...ownerSnapshot, offers };
          setSnapshot(next);
          onCountChange?.(offers.length);
          onRfqStatusChange?.(ownerListingRfqStatus(next));
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [onCountChange, onRfqStatusChange, snapshot?.status, tripId]);

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
        const next = { ...ownerSnapshot, offers };
        setSnapshot(next);
        onCountChange?.(offers.length);
        onRfqStatusChange?.(ownerListingRfqStatus(next));
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
      <AppText weight="bold" style={styles.headerTitle}>
        {t('dashboard.listings.detail.responses.title')}
      </AppText>

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
            const phone = offer.responderPhone?.trim() || null;
            const showMessage =
              offer.status === 'active' ||
              offer.status === 'selected' ||
              (offer.status === 'confirmed' && Boolean(phone));
            const displayName =
              offer.responderName?.trim() ||
              t('dashboard.listings.detail.responses.offerLabel', { index: index + 1 });
            const priceLabel =
              offer.price != null
                ? t('dashboard.listings.card.priceWithCurrency', { price: offer.price })
                : '';

            return (
              <OfferResponseCard
                key={offer.id}
                tag={statusLabel(offer.status)}
                tagTone={TAG_TONE_BY_STATUS[offer.status]}
                cardTone={
                  offer.status === 'confirmed'
                    ? 'confirmed'
                    : offer.status === 'selected'
                      ? 'selected'
                      : 'default'
                }
                name={displayName}
                verified={offer.responderIsVerified === true}
                priceLabel={priceLabel}
                showMessage={showMessage}
                onMessagePress={() => setChatTarget(offer)}
                vehicle={offer.vehicle}
                onVehiclePress={() => {
                  if (offer.vehicle) {
                    setVehicleDetail(offer.vehicle);
                  }
                }}
                footer={canDecide ? 'decide' : phone ? 'whatsapp' : null}
                onReject={() => setRejectTarget(offer)}
                onAccept={() => act(offer.id, 'select')}
                acceptLoading={isActing}
                actionsDisabled={isActing}
                whatsappPhone={phone}
                whatsappMessage={whatsappMessage}
              />
            );
          })}
        </View>
      )}

      <OfferVehicleDetailSheet
        visible={vehicleDetail != null}
        vehicle={vehicleDetail}
        onClose={() => setVehicleDetail(null)}
      />

      <TripMessagingSheet
        visible={chatTarget != null}
        onClose={() => setChatTarget(null)}
        tripId={tripId}
        counterpartyId={chatTarget?.responderId ?? ''}
        counterpartyName={chatTarget?.responderName?.trim() || null}
        counterpartyRole={isPassengerRequest ? 'driver' : 'passenger'}
        offerId={chatTarget?.id}
      />

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
});
