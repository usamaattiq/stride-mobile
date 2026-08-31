import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type DocumentReviewStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

type DocumentReviewStatusBannerProps = {
  status: DocumentReviewStatus;
  rejectionReason?: string | null;
};

export function DocumentReviewStatusBanner({
  status,
  rejectionReason,
}: DocumentReviewStatusBannerProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  if (status === 'not_submitted') {
    return null;
  }

  const config =
    status === 'pending'
      ? {
          icon: 'clock-o' as const,
          title: t('verificationStatus.pendingTitle'),
          body: t('verificationStatus.pendingBody'),
          container: styles.pending,
          iconColor: colors.accent.blue.text,
          titleColor: colors.accent.blue.text,
        }
      : status === 'rejected'
        ? {
            icon: 'times-circle' as const,
            title: t('verificationStatus.rejectedTitle'),
            body:
              rejectionReason?.trim() ||
              t('verificationStatus.rejectedBody'),
            container: styles.rejected,
            iconColor: colors.primary,
            titleColor: colors.primary,
          }
        : {
            icon: 'check-circle' as const,
            title: t('verificationStatus.approvedTitle'),
            body: t('verificationStatus.approvedBody'),
            container: styles.approved,
            iconColor: colors.accent.green.text,
            titleColor: colors.accent.green.text,
          };

  return (
    <View style={[styles.banner, config.container]}>
      <FontAwesome name={config.icon} size={16} color={config.iconColor} />
      <View style={styles.copy}>
        <AppText weight="bold" style={[styles.title, { color: config.titleColor }]}>
          {config.title}
        </AppText>
        <AppText style={styles.body}>{config.body}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  pending: {
    backgroundColor: colors.accent.blue.soft,
  },
  rejected: {
    backgroundColor: colors.primaryMuted,
  },
  approved: {
    backgroundColor: colors.accent.green.soft,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
  },
  body: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
