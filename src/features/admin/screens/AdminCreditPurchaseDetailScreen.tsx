import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseProofCard } from '@/features/dashboard/components/CreditPurchaseProofCard';
import { CreditPurchaseRemarksCard } from '@/features/dashboard/components/CreditPurchaseRemarksCard';
import { CreditPurchaseRequestTile } from '@/features/dashboard/components/CreditPurchaseRequestTile';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { adminApi, type AdminCreditPurchaseDetail } from '@/services/api/adminApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, getInputFontFamily, radius, spacing } from '@/theme';

import type { AdminCreditsStackParamList } from '../navigation/adminNavigationTypes';

export function AdminCreditPurchaseDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCreditsStackParamList>>();
  const route = useRoute<RouteProp<AdminCreditsStackParamList, 'CreditPurchaseDetail'>>();
  const [purchase, setPurchase] = React.useState<AdminCreditPurchaseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reviewing, setReviewing] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [remarks, setRemarks] = React.useState('');
  const [remarksError, setRemarksError] = React.useState(false);
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

  const closeReject = () => {
    setRejectOpen(false);
    setRemarks('');
    setRemarksError(false);
  };

  const review = async (action: 'approve' | 'reject') => {
    if (!purchase || reviewing) {
      return;
    }
    if (action === 'reject') {
      const trimmed = remarks.trim();
      if (!trimmed) {
        setRemarksError(true);
        return;
      }
    }
    setReviewing(true);
    setErrorKey(null);
    try {
      const updated = await adminApi.reviewCreditPurchase(
        purchase.id,
        action,
        action === 'reject' ? remarks.trim() : undefined,
      );
      setPurchase(updated);
      closeReject();
    } catch {
      setErrorKey('admin.credits.reviewFailed');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <>
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
                createdAt={purchase.createdAt}
                avatarUrl={purchase.user.avatarViewUrl}
                showAvatar
                onPress={() =>
                  navigation.navigate('UserDetail', { userId: purchase.user.id })
                }
              />
            </View>
            {purchase.proofViewUrl ? (
              <CreditPurchaseProofCard uri={purchase.proofViewUrl} />
            ) : null}
            {purchase.status === 'rejected' && purchase.rejectionReason?.trim() ? (
              <CreditPurchaseRemarksCard remarks={purchase.rejectionReason} />
            ) : null}
            {purchase.status === 'pending' ? (
              <View style={styles.actions}>
                <Button
                  label={t('admin.credits.reject')}
                  variant="secondary"
                  onPress={() => {
                    setRemarks('');
                    setRemarksError(false);
                    setRejectOpen(true);
                  }}
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
      <AppDialog
        visible={rejectOpen}
        icon="times-circle"
        title={t('admin.credits.rejectTitle')}
        message={t('admin.credits.rejectMessage')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: closeReject,
        }}
        confirmAction={{
          label: reviewing ? t('admin.common.saving') : t('admin.credits.reject'),
          onPress: () => void review('reject'),
          disabled: reviewing || remarks.trim().length === 0,
          loading: reviewing,
        }}
      >
        <AppText weight="medium" style={styles.remarksLabel}>
          {t('admin.credits.rejectRemarks')}
        </AppText>
        <TextInput
          value={remarks}
          onChangeText={(text) => {
            setRemarks(text);
            if (text.trim()) {
              setRemarksError(false);
            }
          }}
          multiline
          maxLength={500}
          placeholder={t('admin.credits.rejectRemarks')}
          placeholderTextColor={colors.text.tertiary}
          style={[
            styles.remarksInput,
            remarksError && styles.remarksInputError,
            { fontFamily: getInputFontFamily(currentLanguage) },
          ]}
        />
        {remarksError ? (
          <AppText style={styles.remarksHint}>{t('admin.credits.rejectRemarksRequired')}</AppText>
        ) : null}
      </AppDialog>
    </>
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
  remarksLabel: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text.primary,
  },
  remarksInput: {
    marginTop: spacing.xs,
    minHeight: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  remarksInputError: {
    borderColor: colors.primary,
  },
  remarksHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.primary,
  },
});
