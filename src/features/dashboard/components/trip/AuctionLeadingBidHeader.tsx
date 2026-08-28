import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { i18n as appI18n } from '@/i18n';
import type { AuctionType } from '@/services/api/auctionApi.types';
import { AppText } from '@/shared/components/AppText';
import { formatPriceWithCurrency } from '@/shared/utils/currency';
import { colors, radius, spacing } from '@/theme';

export function formatAuctionRemaining(seconds: number, t: TFunction): string {
  const totalMinutes = Math.max(0, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return t('dashboard.listings.detail.bid.remainingHours', { hours, minutes });
  }
  return t('dashboard.listings.detail.bid.remainingMinutes', { minutes });
}

export function auctionEndsAtMs(snapshot: {
  remainingSeconds?: number | null;
  endsAt?: string | null;
} | null): number | null {
  if (!snapshot) {
    return null;
  }
  if (snapshot.endsAt) {
    const parsed = Date.parse(snapshot.endsAt);
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      return parsed;
    }
  }
  if (snapshot.remainingSeconds != null && snapshot.remainingSeconds > 0) {
    return Date.now() + snapshot.remainingSeconds * 1000;
  }
  return null;
}

export function remainingSecondsUntil(endsAtMs: number | null | undefined, now: number): number | null {
  if (endsAtMs == null || !Number.isFinite(endsAtMs)) {
    return null;
  }
  const remaining = Math.ceil((endsAtMs - now) / 1000);
  return remaining > 0 ? remaining : null;
}

type AuctionLeadingBidHeaderProps = {
  auctionType: AuctionType;
  currentAmount: number;
  remainingSeconds: number | null;
  trailing?: React.ReactNode;
};

export function AuctionLeadingBidHeader({
  auctionType,
  currentAmount,
  remainingSeconds,
  trailing,
}: AuctionLeadingBidHeaderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const remaining =
    remainingSeconds != null && remainingSeconds > 0
      ? formatAuctionRemaining(remainingSeconds, t)
      : null;
  const endingSoon =
    remainingSeconds != null && remainingSeconds > 0 && remainingSeconds < 60 * 60;
  const timerLabel = endingSoon ? t('dashboard.listings.card.endingSoon') : remaining;
  const heading =
    auctionType === 'reverse'
      ? t('dashboard.listings.detail.bid.titleLowest')
      : t('dashboard.listings.detail.bid.title');

  return (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <AppText weight="bold" style={styles.title}>
          {heading}
        </AppText>
        {timerLabel ? (
          <View style={[styles.timerChip, endingSoon && styles.timerChipSoon]}>
            <FontAwesome
              name="clock-o"
              size={11}
              color={endingSoon ? colors.accent.amber.text : colors.accent.green.text}
            />
            <AppText
              weight="semibold"
              style={[styles.timerText, endingSoon && styles.timerTextSoon]}
              numberOfLines={1}
            >
              {timerLabel}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.priceRow}>
        <AppText weight="bold" style={styles.amount}>
          {formatPriceWithCurrency(currentAmount)}
        </AppText>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: colors.text.primary,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accent.green.soft,
    flexShrink: 0,
  },
  timerChipSoon: {
    backgroundColor: colors.accent.amber.soft,
  },
  timerText: {
    fontSize: 12,
    color: colors.accent.green.text,
  },
  timerTextSoon: {
    color: colors.accent.amber.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  amount: {
    flexShrink: 0,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
  },
});
