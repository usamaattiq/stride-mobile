import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseProofCard } from '@/features/dashboard/components/CreditPurchaseProofCard';
import { CreditPurchaseRequestTile } from '@/features/dashboard/components/CreditPurchaseRequestTile';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminCreditPurchaseDetail } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import type { AdminCreditsStackParamList } from '../navigation/adminNavigationTypes';

export function AdminCreditPurchaseDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCreditsStackParamList>>();
  const route = useRoute<RouteProp<AdminCreditsStackParamList, 'CreditPurchaseDetail'>>();
  const [purchase, setPurchase] = React.useState<AdminCreditPurchaseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reviewing, setReviewing] = React.useState(false);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminApi
      .getCreditPurchase(route.params.purchaseId)
      .then((detail) => {
        if (!cancelled) {
          setPurchase(detail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorKey('admin.credits.detailFailed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.purchaseId]);

  const review = async (action: 'approve' | 'reject') => {
    if (!purchase || reviewing) {
      return;
    }
    setReviewing(true);
    setErrorKey(null);
    try {
      const updated = await adminApi.reviewCreditPurchase(purchase.id, action);
      setPurchase(updated);
    } catch {
      setErrorKey('admin.credits.reviewFailed');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('admin.credits.detailTitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !purchase ? (
        <AppText style={styles.error}>{t(errorKey ?? 'admin.credits.detailFailed')}</AppText>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.shadowGutter}>
            <CreditPurchaseRequestTile
              title={purchase.user.fullName}
              subtitle={t('admin.credits.requestFor', { count: purchase.credits })}
              phone={purchase.user.phoneE164}
              credits={purchase.credits}
              amount={purchase.amount}
              unitPrice={purchase.unitPrice}
              status={purchase.status}
              avatarUrl={purchase.user.avatarViewUrl}
              onPress={() =>
                navigation.navigate('UserDetail', { userId: purchase.user.id })
              }
            />
          </View>
          {purchase.rejectionReason ? (
            <View style={styles.rejectBox}>
              <AppText style={styles.rejectText}>{purchase.rejectionReason}</AppText>
            </View>
          ) : null}
          {purchase.proofViewUrl ? (
            <CreditPurchaseProofCard uri={purchase.proofViewUrl} />
          ) : null}
          {purchase.status === 'pending' ? (
            <View style={styles.actions}>
              <Button
                label={t('admin.credits.reject')}
                variant="secondary"
                onPress={() => void review('reject')}
                disabled={reviewing}
                style={styles.action}
              />
              <Button
                label={t('admin.credits.approve')}
                onPress={() => void review('approve')}
                disabled={reviewing}
                style={styles.action}
              />
            </View>
          ) : null}
          {errorKey ? <AppText style={styles.error}>{t(errorKey)}</AppText> : null}
        </ScrollView>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  loader: {
    marginTop: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  rejectBox: {
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    padding: spacing.sm,
  },
  rejectText: {
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
});
