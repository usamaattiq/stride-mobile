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
import { isApiErrorWithCode } from '@/services/api/apiError';
import { formatPriceAmount } from '@/shared/utils/latin-digits';
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

function isInactiveListingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  if (!/currently not listed|no active listing/i.test(message)) {
    return false;
  }
  return isApiErrorWithCode(error, 'NOT_FOUND') || error instanceof Error;
}

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

function parseOfferPrice(price: string | null): number | null {
  if (price == null) {
    return null;
  }
  const parsed = Number(String(price).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Passenger requests: cheapest on top. Driver listings: highest on top.
 * Offers without a price stay at the bottom.
 */
function visibleOwnerOffers(
  offers: RfqOfferSummary[],
  lowestBest: boolean,
): RfqOfferSummary[] {
  const latest = latestOffersByResponder(offers);
  return [...latest].sort((a, b) => {
    const priceA = parseOfferPrice(a.price);
    const priceB = parseOfferPrice(b.price);
    if (priceA == null && priceB == null) {
      return 0;
    }
    if (priceA == null) {
      return 1;
    }
    if (priceB == null) {
      return -1;
    }
    return lowestBest ? priceA - priceB : priceB - priceA;
  });
}

function offeredSeatsLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  vehicleMode: TripVehicleMode,
  offeredQuantity: string | null,
  vehicleTotalSeats: number | null,
): string | null {
  if (vehicleMode === 'fullPrivate') {
    return vehicleTotalSeats != null
      ? t('dashboard.listings.detail.responses.seats', { count: vehicleTotalSeats })
      : t('trips.create.vehicleModeFullPrivate');
  }
  const count = Math.floor(Number(offeredQuantity));
  if (!Number.isFinite(count) || count < 1) {
    return null;
  }
  return t('dashboard.listings.detail.responses.seats', { count });
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
  const [notListed, setNotListed] = React.useState(false);
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
        const offers = visibleOwnerOffers(ownerSnapshot.offers, isPassengerRequest);
        const next = { ...ownerSnapshot, offers };
        setNotListed(false);
        setSnapshot(next);
        onCountChange?.(offers.length);
        onRfqStatusChange?.(ownerListingRfqStatus(next));
      })
      .catch((err) => {
        if (isInactiveListingError(err)) {
          setNotListed(true);
          setSnapshot(null);
          onCountChange?.(0);
          return;
        }
        setError(getErrorMessage(err, t('dashboard.listings.detail.responses.loadFailed')));
      })
      .finally(() => setLoading(false));
  }, [tripId, t, onCountChange, onRfqStatusChange, isPassengerRequest]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (snapshot && isTerminalListingStatus(snapshot.status)) {
      return undefined;
    }
    const timer = setInterval(() => {
      void rfqApi
        .getSnapshot(tripId)
        .then((result) => {
          const ownerSnapshot = result as RfqOwnerSnapshot;
          const offers = visibleOwnerOffers(ownerSnapshot.offers, isPassengerRequest);
          const next = { ...ownerSnapshot, offers };
          setNotListed(false);
          setSnapshot(next);
          onCountChange?.(offers.length);
          onRfqStatusChange?.(ownerListingRfqStatus(next));
        })
        .catch((err) => {
          if (isInactiveListingError(err)) {
            setNotListed(true);
            setSnapshot(null);
            onCountChange?.(0);
          }
        });
    }, 5000);
    return () => clearInterval(timer);
  }, [isPassengerRequest, onCountChange, onRfqStatusChange, snapshot?.status, tripId]);

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
        const offers = visibleOwnerOffers(ownerSnapshot.offers, isPassengerRequest);
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

  if (notListed && !snapshot) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.mutedText}>
          {t('dashboard.listings.detail.responses.currentlyNotListed')}
        </AppText>
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
                ? t('dashboard.listings.card.priceWithCurrency', {
                    price: formatPriceAmount(offer.price),
                  })
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
                detailLabel={offeredSeatsLabel(t, vehicleMode, offer.offeredQuantity, vehicleTotalSeats)}
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
  mutedText: {
    fontSize: 14,
    color: colors.text.secondary,
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
