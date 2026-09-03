import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatTripDateTime } from '@/features/dashboard/components/trip/dateRangeUtils';
import { CreditPurchaseProofCard } from '@/features/dashboard/components/CreditPurchaseProofCard';
import { CreditPurchaseRemarksCard } from '@/features/dashboard/components/CreditPurchaseRemarksCard';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useConvertedAmount } from '@/shared/hooks/useConvertedAmount';
import { useDisplayCurrency } from '@/shared/utils/currency';
import { formatPriceAmount } from '@/shared/utils/latin-digits';
import type { CreditPurchaseStatus } from '@/services/api/creditsApi';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

type CreditPurchaseDetailCardProps = {
  title: string;
  subtitle?: string;
  phone?: string | null;
  status: CreditPurchaseStatus;
  credits: number;
  amount: number;
  unitPrice: number;
  createdAt?: string | null;
  proofUri?: string | null;
  rejectionReason?: string | null;
  extra?: React.ReactNode;
};

function statusStyle(status: CreditPurchaseStatus) {
  if (status === 'approved') {
    return { badge: styles.badgeGreen, text: styles.badgeTextGreen, icon: 'check' as const, color: colors.accent.green.text };
  }
  if (status === 'rejected') {
    return { badge: styles.badgeRed, text: styles.badgeTextRed, icon: 'times-circle' as const, color: colors.primary };
  }
  return { badge: styles.badgeAmber, text: styles.badgeTextAmber, icon: 'clock-o' as const, color: colors.accent.amber.text };
}

export function CreditPurchaseDetailCard({
  title,
  subtitle,
  phone,
  status,
  credits,
  amount,
  unitPrice,
  createdAt,
  proofUri,
  rejectionReason,
  extra,
}: CreditPurchaseDetailCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const isRtl = I18nManager.isRTL;
  const statusUi = statusStyle(status);
  const currency = useDisplayCurrency();
  const ratePerCreditPkr = credits > 0 ? amount / credits : 0;
  const isPkr = currency.toUpperCase() === 'PKR';
  const convertedUnitPrice = useConvertedAmount(unitPrice, currency);
  const convertedTotal = useConvertedAmount(unitPrice * credits, currency);
  const displayRate = isPkr ? ratePerCreditPkr : convertedUnitPrice;
  const displayTotal = isPkr ? amount : convertedTotal;
  const timestamp = createdAt
    ? formatTripDateTime(createdAt, currentLanguage, '')
    : '';
  const statusLabel =
    status === 'approved'
      ? t('dashboard.home.statusApproved')
      : status === 'rejected'
        ? t('dashboard.home.statusRejected')
        : t('dashboard.home.statusPending');

  return (
    <View>
      <View style={styles.shadowGutter}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
            locations={[0, 0.28, 0.52, 0.78, 1]}
            start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
            end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
            style={styles.inner}
          >
            <View style={styles.topRow}>
              <View style={[styles.badge, statusUi.badge]}>
                <FontAwesome name={statusUi.icon} size={10} color={statusUi.color} />
                <AppText weight="semibold" style={[styles.badgeText, statusUi.text]}>
                  {statusLabel}
                </AppText>
              </View>
              {timestamp ? (
                <View style={styles.timeBadge}>
                  <FontAwesome name="clock-o" size={10} color={colors.text.secondary} />
                  <AppText weight="semibold" style={styles.timeBadgeText} numberOfLines={1}>
                    {timestamp}
                  </AppText>
                </View>
              ) : null}
            </View>

            {phone?.trim() ? (
              <View style={styles.phoneRow}>
                <FontAwesome name="phone" size={13} color={colors.primary} />
                <AppText style={styles.phone}>{phone.trim()}</AppText>
              </View>
            ) : null}
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}

            <View style={styles.qtyRow}>
              <AppText weight="medium" style={styles.qtyLabel} numberOfLines={1}>
                {t('dashboard.home.totalCredits')}
              </AppText>
              <AppText weight="semibold" style={styles.qtyValue} accessibilityLabel={title}>
                {credits}
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('dashboard.home.ratePerCredit')}</AppText>
              <View style={styles.totalBlock}>
                <AppText weight="semibold" style={styles.metaValue}>
                  {displayRate != null
                    ? t('dashboard.listings.card.priceWithCurrency', {
                        currency,
                        price: formatPriceAmount(displayRate),
                      })
                    : ''}
                </AppText>
              </View>
            </View>
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('dashboard.home.totalPrice')}</AppText>
              <View style={styles.totalBlock}>
                {displayRate != null ? (
                  <AppText style={styles.totalCalc}>
                    {t('dashboard.home.creditsTimesPrice', {
                      count: credits,
                      currency,
                      price: formatPriceAmount(displayRate),
                    })}
                  </AppText>
                ) : null}
                <AppText weight="bold" style={styles.totalValue}>
                  {displayTotal != null
                    ? t('dashboard.listings.card.priceWithCurrency', {
                        currency,
                        price: formatPriceAmount(displayTotal),
                      })
                    : ''}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
      {proofUri ? <CreditPurchaseProofCard uri={proofUri} /> : null}
      {status === 'rejected' && rejectionReason?.trim() ? (
        <CreditPurchaseRemarksCard remarks={rejectionReason} showContactSupport />
      ) : null}
      {extra}
    </View>
  );
}

const styles = StyleSheet.create({
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 4,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...cardBackShadow,
  },
  inner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexShrink: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background.subtle,
    flexShrink: 1,
    maxWidth: '58%',
  },
  timeBadgeText: {
    fontSize: 11,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  badgeGreen: { backgroundColor: colors.accent.green.soft },
  badgeAmber: { backgroundColor: colors.accent.amber.soft },
  badgeRed: { backgroundColor: colors.primaryMuted },
  badgeText: { fontSize: 12 },
  badgeTextGreen: { color: colors.accent.green.text },
  badgeTextAmber: { color: colors.accent.amber.text },
  badgeTextRed: { color: colors.primary },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  phone: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.text.primary,
  },
  qtyValue: {
    fontSize: 16,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  metaValue: {
    fontSize: 12,
    color: colors.text.primary,
  },
  totalBlock: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  totalCalc: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'right',
  },
});
