import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { rfqApi } from '@/services/api/rfqApi';
import type { RfqOfferStatus, RfqResponderSnapshot } from '@/services/api/rfqApi.types';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import type { TripVehicleMode } from '../../types/trip.types';

export type TripOfferPanelProps = {
  tripId: string;
  vehicleMode: TripVehicleMode;
  vehicleTotalSeats: number | null;
};

const TERMINAL_STATUSES: RfqOfferStatus[] = ['withdrawn', 'declined', 'timed_out'];

function OfferStatusBadge({ status, label }: { status: RfqOfferStatus; label: string }): React.ReactElement {
  const isConfirmed = status === 'confirmed';
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const bg = isConfirmed ? colors.accent.green.soft : isTerminal ? colors.background.subtle : colors.primarySoft;
  const text = isConfirmed ? colors.accent.green.text : isTerminal ? colors.text.tertiary : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText weight="semibold" style={[styles.badgeText, { color: text }]}>
        {label}
      </AppText>
    </View>
  );
}

export function TripOfferPanel({
  tripId,
  vehicleMode,
  vehicleTotalSeats,
}: TripOfferPanelProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isFullPrivate = vehicleMode === 'fullPrivate';

  const [snapshot, setSnapshot] = React.useState<RfqResponderSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [seats, setSeats] = React.useState(isFullPrivate ? String(vehicleTotalSeats ?? 1) : '1');
  const [price, setPrice] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void rfqApi
      .getSnapshot(tripId)
      .then((result) => setSnapshot(result as RfqResponderSnapshot))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.loadFailed'))))
      .finally(() => setLoading(false));
  }, [tripId, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !snapshot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!snapshot) {
    return error ? (
      <View style={styles.card}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button label={t('dashboard.listings.detail.offer.retry')} onPress={load} />
      </View>
    ) : null;
  }

  const activeOffer =
    snapshot.myOffers.find((offer) => !TERMINAL_STATUSES.includes(offer.status)) ??
    snapshot.myOffers[snapshot.myOffers.length - 1] ??
    null;
  const hasActionableOffer = activeOffer != null && !TERMINAL_STATUSES.includes(activeOffer.status);

  const seatsNumber = Number(seats);
  const maxSeats = vehicleTotalSeats ?? 50;
  const seatsValid = isFullPrivate || (Number.isInteger(seatsNumber) && seatsNumber >= 1 && seatsNumber <= maxSeats);
  const priceNumber = Number(price);
  const priceValid = price.trim().length > 0 && Number.isFinite(priceNumber) && priceNumber >= 0;
  const canSubmit = seatsValid && priceValid && !submitting;

  const submitOffer = () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    void rfqApi
      .submitOffer(tripId, {
        seats: isFullPrivate ? (vehicleTotalSeats ?? 1) : seatsNumber,
        price: priceNumber,
      })
      .then(() => load())
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.submitFailed'))))
      .finally(() => setSubmitting(false));
  };

  const withdrawOffer = () => {
    if (!activeOffer) {
      return;
    }
    setWithdrawing(true);
    setError(null);
    void rfqApi
      .withdrawOffer(tripId, activeOffer.id)
      .then(() => load())
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.withdrawFailed'))))
      .finally(() => {
        setWithdrawing(false);
        setConfirmWithdraw(false);
      });
  };

  return (
    <View style={styles.card}>
      <AppText weight="bold" style={styles.title}>
        {t('dashboard.listings.detail.offer.title')}
      </AppText>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      {hasActionableOffer && activeOffer ? (
        <View style={styles.statusRow}>
          <View style={styles.statusCopy}>
            {activeOffer.offeredQuantity != null ? (
              <AppText style={styles.meta}>
                {t('dashboard.listings.detail.responses.seats', {
                  count: Number(activeOffer.offeredQuantity),
                })}
              </AppText>
            ) : null}
            {activeOffer.price != null ? (
              <AppText weight="semibold" style={styles.price}>
                {t('dashboard.listings.card.priceWithCurrency', { price: activeOffer.price })}
              </AppText>
            ) : null}
          </View>
          <OfferStatusBadge
            status={activeOffer.status}
            label={t(`dashboard.listings.detail.responses.offerStatus.${activeOffer.status}`)}
          />
        </View>
      ) : null}

      {hasActionableOffer && activeOffer?.status === 'active' && snapshot.actions.canWithdraw ? (
        <Button
          label={t('dashboard.listings.detail.offer.withdraw')}
          variant="secondary"
          onPress={() => setConfirmWithdraw(true)}
          loading={withdrawing}
          disabled={withdrawing}
        />
      ) : null}

      {!hasActionableOffer && snapshot.actions.canSubmitOffer ? (
        <View style={styles.form}>
          {!isFullPrivate ? (
            <AuthTextField
              label={t('dashboard.listings.detail.offer.seatsLabel')}
              value={seats}
              onChangeText={setSeats}
              keyboardType="number-pad"
              placeholder={t('dashboard.listings.detail.offer.seatsPlaceholder')}
              dense
            />
          ) : null}
          <AuthTextField
            label={t('dashboard.listings.detail.offer.priceLabel')}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder={t('dashboard.listings.detail.offer.pricePlaceholder')}
            dense
          />
          <Button
            label={t('dashboard.listings.detail.offer.submit')}
            onPress={submitOffer}
            loading={submitting}
            disabled={!canSubmit}
          />
        </View>
      ) : null}

      {!hasActionableOffer && !snapshot.actions.canSubmitOffer ? (
        <AppText style={styles.closedText}>{t('dashboard.listings.detail.offer.closed')}</AppText>
      ) : null}

      <AppDialog
        visible={confirmWithdraw}
        icon="undo"
        title={t('dashboard.listings.detail.offer.withdrawConfirmTitle')}
        message={t('dashboard.listings.detail.offer.withdrawConfirmBody')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setConfirmWithdraw(false),
        }}
        confirmAction={{
          label: t('dashboard.listings.detail.offer.withdraw'),
          onPress: withdrawOffer,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusCopy: {
    gap: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  price: {
    fontSize: 15,
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
  form: {
    gap: spacing.sm,
  },
  closedText: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
