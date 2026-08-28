import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseDetailCard } from '@/features/dashboard/components/CreditPurchaseDetailCard';
import type { HomeStackParamList } from '@/features/dashboard/navigation/homeTypes';
import { i18n as appI18n } from '@/i18n';
import { creditsApi, type CreditPurchase } from '@/services/api/creditsApi';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

export function BuyCreditRequestDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'BuyCreditRequestDetail'>>();
  const [purchase, setPurchase] = React.useState<CreditPurchase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void creditsApi
      .getPurchase(route.params.purchaseId)
      .then((item) => {
        if (!cancelled) {
          setPurchase(item);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
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

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('dashboard.home.requestDetailTitle')}
      compactHeader
      showLanguageSwitcher={false}
      showLegalFooter={false}
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !purchase || failed ? (
        <AppText style={styles.error}>
          {t('dashboard.home.requestDetailFailed')}
        </AppText>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <CreditPurchaseDetailCard
            title={t('dashboard.home.creditsA11y', { count: purchase.credits })}
            createdAt={purchase.createdAt}
            status={purchase.status}
            credits={purchase.credits}
            amount={purchase.amount}
            unitPrice={purchase.unitPrice}
            proofUri={purchase.proofViewUrl}
            rejectionReason={purchase.rejectionReason}
          />
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
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
  },
});
