import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

type CreditPurchaseRemarksCardProps = {
  remarks: string;
  showContactSupport?: boolean;
};

export function CreditPurchaseRemarksCard({
  remarks,
  showContactSupport = false,
}: CreditPurchaseRemarksCardProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;
  const text = remarks.trim();
  if (!text) {
    return null;
  }

  return (
    <View style={styles.shadowGutter}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
          locations={[0, 0.28, 0.52, 0.78, 1]}
          start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
          end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
          style={styles.inner}
        >
          <View style={styles.titleRow}>
            <FontAwesome name="times-circle" size={16} color={colors.primary} />
            <AppText weight="bold" style={styles.title}>
              {t('dashboard.home.rejectionRemarksLabel')}
            </AppText>
          </View>
          <View style={styles.rejectBox}>
            <AppText style={styles.body}>{text}</AppText>
          </View>
          {showContactSupport ? (
            <Button
              label={t('dashboard.home.contactSupport')}
              variant="secondary"
            />
          ) : null}
        </LinearGradient>
      </View>
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  rejectBox: {
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    padding: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
});
