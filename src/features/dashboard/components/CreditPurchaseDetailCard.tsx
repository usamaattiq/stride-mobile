import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CreditPurchaseProofCard } from '@/features/dashboard/components/CreditPurchaseProofCard';

import { i18n as appI18n } from '@/i18n';
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
  proofUri,
  rejectionReason,
  extra,
}: CreditPurchaseDetailCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;
  const statusUi = statusStyle(status);
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
            <View style={[styles.badge, statusUi.badge]}>
              <FontAwesome name={statusUi.icon} size={10} color={statusUi.color} />
              <AppText weight="semibold" style={[styles.badgeText, statusUi.text]}>
                {statusLabel}
              </AppText>
            </View>
            <AppText weight="bold" style={styles.title}>
              {title}
            </AppText>
            {phone?.trim() ? (
              <View style={styles.phoneRow}>
                <FontAwesome name="phone" size={13} color={colors.primary} />
                <AppText style={styles.phone}>{phone.trim()}</AppText>
              </View>
            ) : null}
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}

            <View style={styles.metaRow}>
              <FontAwesome5 name="coins" size={13} color={colors.accent.coins} solid />
              <AppText weight="semibold" style={styles.metaText}>
                {t('dashboard.home.creditsA11y', { count: credits })}
              </AppText>
            </View>
            <AppText style={styles.calc}>
              {t('dashboard.home.creditsTimesPrice', { count: credits, price: unitPrice })}
            </AppText>
            <AppText weight="bold" style={styles.priceLine}>
              {t('dashboard.home.requestAmount', { amount })}
            </AppText>
            {rejectionReason ? (
              <View style={styles.rejectBox}>
                <AppText style={styles.rejectText}>{rejectionReason}</AppText>
              </View>
            ) : null}
          </LinearGradient>
        </View>
      </View>
      {proofUri ? <CreditPurchaseProofCard uri={proofUri} /> : null}
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
    borderRadius: radius.lg,
    ...cardBackShadow,
  },
  inner: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeGreen: { backgroundColor: colors.accent.green.soft },
  badgeAmber: { backgroundColor: colors.accent.amber.soft },
  badgeRed: { backgroundColor: colors.primaryMuted },
  badgeText: { fontSize: 12 },
  badgeTextGreen: { color: colors.accent.green.text },
  badgeTextAmber: { color: colors.accent.amber.text },
  badgeTextRed: { color: colors.primary },
  title: {
    fontSize: 22,
    color: colors.text.primary,
  },
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  calc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  priceLine: {
    fontSize: 16,
    color: colors.text.primary,
  },
  rejectBox: {
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    padding: spacing.sm,
  },
  rejectText: {
    color: colors.primary,
  },
});
