import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import type { CreditPurchaseStatus } from '@/services/api/creditsApi';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

type CreditPurchaseRequestTileProps = {
  title: string;
  subtitle: string;
  credits: number;
  amount: number;
  unitPrice: number;
  status: CreditPurchaseStatus;
  onPress: () => void;
};

function statusStyle(status: CreditPurchaseStatus) {
  if (status === 'approved') {
    return {
      badge: styles.badgeGreen,
      text: styles.badgeTextGreen,
      icon: 'check' as const,
      color: colors.accent.green.text,
    };
  }
  if (status === 'rejected') {
    return {
      badge: styles.badgeRed,
      text: styles.badgeTextRed,
      icon: 'times-circle' as const,
      color: colors.primary,
    };
  }
  return {
    badge: styles.badgeAmber,
    text: styles.badgeTextAmber,
    icon: 'clock-o' as const,
    color: colors.accent.amber.text,
  };
}

export function CreditPurchaseRequestTile({
  title,
  subtitle,
  credits,
  amount,
  unitPrice,
  status,
  onPress,
}: CreditPurchaseRequestTileProps): React.ReactElement {
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
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
          locations={[0, 0.28, 0.52, 0.78, 1]}
          start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
          end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
          style={styles.inner}
        >
          <View style={styles.statusRow}>
            <View style={[styles.badge, statusUi.badge]}>
              <FontAwesome name={statusUi.icon} size={9} color={statusUi.color} />
              <AppText weight="semibold" style={[styles.badgeText, statusUi.text]} numberOfLines={1}>
                {statusLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.mainRow}>
            <View style={styles.copy}>
              <AppText weight="bold" style={styles.title} numberOfLines={1}>
                {title}
              </AppText>
              <AppText style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </AppText>
              <AppText style={styles.calc} numberOfLines={1}>
                {t('dashboard.home.creditsTimesPrice', { count: credits, price: unitPrice })}
              </AppText>
              <AppText weight="semibold" style={styles.price} numberOfLines={1}>
                {t('dashboard.home.requestAmount', { amount })}
              </AppText>
            </View>
            <FontAwesome name="chevron-right" size={12} color={colors.text.tertiary} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 2,
  },
  item: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  pressed: {
    opacity: 0.92,
  },
  inner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 1,
  },
  badgeGreen: {
    backgroundColor: colors.accent.green.soft,
  },
  badgeAmber: {
    backgroundColor: colors.accent.amber.soft,
  },
  badgeRed: {
    backgroundColor: colors.primaryMuted,
  },
  badgeText: {
    fontSize: 11,
  },
  badgeTextGreen: {
    color: colors.accent.green.text,
  },
  badgeTextAmber: {
    color: colors.accent.amber.text,
  },
  badgeTextRed: {
    color: colors.primary,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  calc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  price: {
    fontSize: 14,
    color: colors.text.primary,
  },
});
