import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { auctionApi } from '@/services/api/auctionApi';
import type {
  AuctionParticipantSnapshot,
  AuctionParticipantStatus,
  AuctionPublicSnapshot,
  AuctionStatusValue,
  AuctionType,
} from '@/services/api/auctionApi.types';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import { WhatsAppContactCard } from './WhatsAppContactCard';

export type TripBidPanelProps = {
  tripId: string;
  isPassengerRequest?: boolean;
  onBidChange?: (update: {
    auctionStatus: AuctionStatusValue;
    auctionStatusLabel: string;
    auctionStatusVariant: 'muted' | 'accent' | 'warning' | 'success';
    myBidStatus: AuctionParticipantStatus | null;
    myBidAmount: number | null;
    counterpartyName: string | null;
    counterpartyPhone: string | null;
  }) => void;
};

function formatAmount(amount: number | null | undefined): string {
  if (amount == null) {
    return '—';
  }
  return String(amount);
}

function formatRemaining(seconds: number, t: TFunction): string {
  const totalMinutes = Math.max(0, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return t('dashboard.listings.detail.bid.remainingHours', { hours, minutes });
  }
  return t('dashboard.listings.detail.bid.remainingMinutes', { minutes });
}

function bidUpdateFromSnapshot(snapshot: AuctionParticipantSnapshot) {
  return {
    auctionStatus: snapshot.status,
    auctionStatusLabel: snapshot.statusLabel,
    auctionStatusVariant: snapshot.statusVariant,
    myBidStatus: snapshot.participantStatus,
    myBidAmount: snapshot.myPeakAmount,
    counterpartyName: snapshot.ownerName ?? null,
    counterpartyPhone: snapshot.ownerPhone ?? null,
  };
}

function winRuleLabel(auctionType: AuctionType, t: TFunction): string {
  return auctionType === 'reverse'
    ? t('dashboard.listings.detail.bid.lowestWins')
    : t('dashboard.listings.detail.bid.highestWins');
}

function nextBidHint(
  auctionType: AuctionType,
  minNextAmount: number | null | undefined,
  currentAmount: number,
  t: TFunction,
): string {
  if (auctionType === 'reverse') {
    const ceiling = currentAmount > 0 ? currentAmount : minNextAmount;
    return ceiling != null && ceiling > 1
      ? t('dashboard.listings.detail.bid.maxNext', { amount: ceiling })
      : t('dashboard.listings.detail.bid.amountPlaceholder');
  }
  return minNextAmount != null
    ? t('dashboard.listings.detail.bid.minNext', { amount: minNextAmount })
    : t('dashboard.listings.detail.bid.amountPlaceholder');
}

export function TripBidPanel({
  tripId,
  isPassengerRequest = false,
  onBidChange,
}: TripBidPanelProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [snapshot, setSnapshot] = React.useState<AuctionParticipantSnapshot | null>(null);
  const [publicSnapshot, setPublicSnapshot] = React.useState<AuctionPublicSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const amountTouchedRef = React.useRef(false);

  const whatsappMessage = isPassengerRequest
    ? t('dashboard.listings.detail.contact.messageAsDriver')
    : t('dashboard.listings.detail.contact.messageAsPassenger');

  const applySnapshot = React.useCallback(
    (result: AuctionParticipantSnapshot, options?: { seedAmount?: boolean }) => {
      setSnapshot(result);
      setPublicSnapshot(null);
      onBidChange?.(bidUpdateFromSnapshot(result));
      // Only prefill once — polling must not clobber what the user is typing.
      // Reverse auctions report minNextAmount=1, which was resetting the field to "1".
      if (
        options?.seedAmount &&
        !amountTouchedRef.current &&
        result.auctionType === 'forward' &&
        result.minNextAmount != null &&
        !result.hasParticipated
      ) {
        setAmount(String(result.minNextAmount));
      }
    },
    [onBidChange],
  );

  const handleAmountChange = React.useCallback((text: string) => {
    amountTouchedRef.current = true;
    setAmount(text.replace(/[^\d]/g, ''));
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void auctionApi
      .getSnapshot(tripId)
      .then((result) => {
        if (result.role === 'owner') {
          setError(t('dashboard.listings.detail.bid.loadFailed'));
          return;
        }
        if (result.role === 'public') {
          setSnapshot(null);
          setPublicSnapshot(result);
          setError(null);
          return;
        }
        applySnapshot(result, { seedAmount: true });
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.bid.loadFailed'))))
      .finally(() => setLoading(false));
  }, [applySnapshot, t, tripId]);

  React.useEffect(() => {
    amountTouchedRef.current = false;
    setAmount('');
    load();
  }, [load]);

  // Poll while live so countdown / lead status stay fresh without a WS client.
  React.useEffect(() => {
    const isLive =
      snapshot?.status === 'live' || publicSnapshot?.status === 'live';
    if (!isLive) {
      return undefined;
    }
    const timer = setInterval(() => {
      void auctionApi
        .getSnapshot(tripId)
        .then((result) => {
          if (result.role === 'participant') {
            applySnapshot(result);
          } else if (result.role === 'public') {
            setPublicSnapshot(result);
          }
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [applySnapshot, publicSnapshot?.status, snapshot?.status, tripId]);

  const placeBid = () => {
    const parsed = Math.round(Number(amount.replace(/[^\d]/g, '')));
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError(t('dashboard.listings.detail.bid.invalidAmount'));
      return;
    }
    setSubmitting(true);
    setError(null);
    void auctionApi
      .placeBid(tripId, { amount: parsed })
      .then((result) => {
        if (result.role === 'participant') {
          amountTouchedRef.current = false;
          applySnapshot(result);
        }
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.bid.submitFailed'))))
      .finally(() => setSubmitting(false));
  };

  const runAction = (action: 'withdraw' | 'confirm' | 'decline') => {
    setSubmitting(true);
    setError(null);
    const request =
      action === 'withdraw'
        ? auctionApi.withdraw
        : action === 'confirm'
          ? auctionApi.confirm
          : auctionApi.decline;
    void request(tripId)
      .then((result) => {
        if (result.role === 'participant') {
          applySnapshot(result);
        }
      })
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.bid.actionFailed'))))
      .finally(() => {
        setSubmitting(false);
        setConfirmWithdraw(false);
        setConfirmDecline(false);
      });
  };

  if (loading && !snapshot && !publicSnapshot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !snapshot && !publicSnapshot) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button label={t('dashboard.listings.detail.bid.retry')} onPress={load} />
      </View>
    );
  }

  if (!snapshot && publicSnapshot) {
    const remaining =
      publicSnapshot.remainingSeconds != null
        ? formatRemaining(publicSnapshot.remainingSeconds, t)
        : null;
    return (
      <View style={styles.root}>
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.listings.detail.bid.title')}
        </AppText>
        <View style={styles.statusCard}>
          <AppText weight="semibold" style={styles.statusLabel}>
            {publicSnapshot.statusLabel}
          </AppText>
          <AppText style={styles.meta}>{winRuleLabel(publicSnapshot.auctionType, t)}</AppText>
          <AppText style={styles.meta}>
            {t('dashboard.listings.detail.bid.currentAmount', {
              amount: formatAmount(publicSnapshot.currentAmount),
            })}
          </AppText>
          {remaining ? <AppText style={styles.meta}>{remaining}</AppText> : null}
        </View>
        <AppText style={styles.meta}>{t('dashboard.listings.detail.bid.openHint')}</AppText>
        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
        <AuthTextField
          label={t('dashboard.listings.detail.bid.amountLabel')}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="number-pad"
          placeholder={nextBidHint(
            publicSnapshot.auctionType,
            null,
            publicSnapshot.currentAmount,
            t,
          )}
        />
        <Button
          label={t('dashboard.listings.detail.bid.submit')}
          onPress={placeBid}
          loading={submitting}
        />
      </View>
    );
  }

  if (!snapshot) {
    return <View />;
  }

  const actions = snapshot.actions;
  const remaining =
    snapshot.remainingSeconds != null
      ? formatRemaining(snapshot.remainingSeconds, t)
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.listings.detail.bid.title')}
        </AppText>
        <Pressable onPress={load} hitSlop={10} accessibilityRole="button">
          <FontAwesome name="refresh" size={16} color={colors.text.tertiary} />
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <AppText weight="semibold" style={styles.statusLabel}>
          {snapshot.statusLabel}
        </AppText>
        <AppText style={styles.meta}>{winRuleLabel(snapshot.auctionType, t)}</AppText>
        <AppText style={styles.meta}>
          {t('dashboard.listings.detail.bid.currentAmount', {
            amount: formatAmount(snapshot.currentAmount),
          })}
        </AppText>
        {snapshot.myPeakAmount != null ? (
          <AppText style={styles.meta}>
            {t('dashboard.listings.detail.bid.yourBid', {
              amount: formatAmount(snapshot.myPeakAmount),
            })}
            {snapshot.isLeading
              ? ` · ${t('dashboard.listings.detail.bid.leading')}`
              : ''}
          </AppText>
        ) : null}
        {remaining ? <AppText style={styles.meta}>{remaining}</AppText> : null}
      </View>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      {actions.canPlaceBid ? (
        <>
          <AuthTextField
            label={t('dashboard.listings.detail.bid.amountLabel')}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
            placeholder={nextBidHint(
              snapshot.auctionType,
              snapshot.minNextAmount,
              snapshot.currentAmount,
              t,
            )}
          />
          <Button
            label={
              snapshot.hasParticipated
                ? t('dashboard.listings.detail.bid.update')
                : t('dashboard.listings.detail.bid.submit')
            }
            onPress={placeBid}
            loading={submitting}
          />
        </>
      ) : null}

      {actions.canConfirm || actions.canDecline ? (
        <View style={styles.actionRow}>
          {actions.canConfirm ? (
            <Button
              label={t('dashboard.listings.detail.bid.confirm')}
              onPress={() => runAction('confirm')}
              loading={submitting}
              style={styles.actionButton}
            />
          ) : null}
          {actions.canDecline ? (
            <Button
              label={t('dashboard.listings.detail.bid.decline')}
              onPress={() => setConfirmDecline(true)}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : null}
        </View>
      ) : null}

      {actions.canWithdraw ? (
        <Button
          label={t('dashboard.listings.detail.bid.withdraw')}
          onPress={() => setConfirmWithdraw(true)}
          variant="secondary"
          loading={submitting}
        />
      ) : null}

      {snapshot.ownerName && snapshot.ownerPhone ? (
        <WhatsAppContactCard
          title={
            isPassengerRequest
              ? t('dashboard.listings.detail.contact.passengerContact')
              : t('dashboard.listings.detail.contact.driverContact')
          }
          name={snapshot.ownerName}
          phone={snapshot.ownerPhone}
          message={whatsappMessage}
        />
      ) : null}

      <AppDialog
        visible={confirmWithdraw}
        title={t('dashboard.listings.detail.bid.withdrawConfirmTitle')}
        message={t('dashboard.listings.detail.bid.withdrawConfirmBody')}
        confirmAction={{
          label: t('dashboard.listings.detail.bid.withdraw'),
          onPress: () => runAction('withdraw'),
        }}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setConfirmWithdraw(false),
        }}
      />
      <AppDialog
        visible={confirmDecline}
        title={t('dashboard.listings.detail.bid.declineConfirmTitle')}
        message={t('dashboard.listings.detail.bid.declineConfirmBody')}
        confirmAction={{
          label: t('dashboard.listings.detail.bid.decline'),
          onPress: () => runAction('decline'),
        }}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setConfirmDecline(false),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    color: colors.text.primary,
  },
  statusCard: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusLabel: {
    color: colors.primary,
    fontSize: 15,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
