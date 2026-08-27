import React from 'react';
import {
  I18nManager,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseProofCard } from '@/features/dashboard/components/CreditPurchaseProofCard';
import { CreditPurchaseRequestTile } from '@/features/dashboard/components/CreditPurchaseRequestTile';
import type { HomeStackParamList } from '@/features/dashboard/navigation/homeTypes';
import { i18n as appI18n } from '@/i18n';
import { creditsApi, type CreditPurchase } from '@/services/api/creditsApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { uploadLocalFileToPresignedUrl } from '@/shared/services/mediaUploadService';
import { refreshSessionProfile } from '@/shared/utils/refresh-session-profile';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

export function BuyCreditsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [quantity, setQuantity] = React.useState(10);
  const [unitPrice, setUnitPrice] = React.useState(2);
  const [proofUri, setProofUri] = React.useState<string | null>(null);
  const [purchases, setPurchases] = React.useState<CreditPurchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentVisible, setSentVisible] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const [catalog, list] = await Promise.all([
        creditsApi.getCatalog(),
        creditsApi.listPurchases(),
      ]);
      setUnitPrice(catalog.unitPrice);
      setPurchases(list.items);
    } catch (err) {
      setError(getErrorMessage(err, t('admin.common.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const total = quantity * unitPrice;

  const pickProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setProofUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!proofUri || submitting) {
      setError(t('dashboard.home.required'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await uploadLocalFileToPresignedUrl(proofUri, {
        purpose: 'credit_purchase_proof',
      });
      await creditsApi.createPurchase({
        credits: quantity,
        proofUrl: uploaded.fileUrl,
      });
      setProofUri(null);
      setSentVisible(true);
      await load();
      void refreshSessionProfile();
    } catch (err) {
      setError(getErrorMessage(err, t('dashboard.home.sendFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const isRtl = I18nManager.isRTL;

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('dashboard.home.buyCreditsTitle')}
        subtitle={t('dashboard.home.buyCreditsSubtitle')}
        compactHeader
        showLanguageSwitcher={false}
        showLegalFooter={false}
        scrollable={false}
        contentWrapStyle={styles.contentWrap}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void load()} />
          }
        >
          <View style={styles.shadowGutter}>
            <View style={styles.card}>
              <LinearGradient
                colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
                locations={[0, 0.28, 0.52, 0.78, 1]}
                start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
                end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                style={styles.cardInner}
              >
              <AppText weight="medium" style={styles.qtyLabel}>
                {t('dashboard.home.quantity')}
              </AppText>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                  style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}
                >
                  <FontAwesome5 name="minus" size={12} color={colors.primary} solid />
                </Pressable>
                <AppText weight="bold" style={styles.qtyValue}>
                  {quantity}
                </AppText>
                <Pressable
                  onPress={() => setQuantity((current) => Math.min(1000, current + 1))}
                  style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}
                >
                  <FontAwesome5 name="plus" size={12} color={colors.primary} solid />
                </Pressable>
              </View>
              <AppText style={styles.calc}>
                {t('dashboard.home.creditsTimesPrice', { count: quantity, price: unitPrice })}
              </AppText>
              <AppText weight="bold" style={styles.total}>
                {t('dashboard.home.total', { amount: total })}
              </AppText>
              </LinearGradient>
            </View>
          </View>

          <CreditPurchaseProofCard
            uri={proofUri}
            hint={t('dashboard.home.proofHint')}
            onPress={() => void pickProof()}
          />
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <Button
            label={submitting ? t('dashboard.home.sending') : t('dashboard.home.sendRequest')}
            onPress={() => void submit()}
            disabled={submitting || !proofUri}
          />

          <AppText weight="bold" style={styles.section}>
            {t('dashboard.home.myRequests')}
          </AppText>
          {purchases.length === 0 ? (
            <AppText style={styles.hint}>{t('dashboard.home.noRequests')}</AppText>
          ) : (
            purchases.map((item) => (
              <View key={item.id} style={styles.shadowGutter}>
                <CreditPurchaseRequestTile
                  title={t('dashboard.home.creditsA11y', { count: item.credits })}
                  subtitle={new Date(item.createdAt).toLocaleString()}
                  credits={item.credits}
                  amount={item.amount}
                  unitPrice={item.unitPrice}
                  status={item.status}
                  onPress={() =>
                    navigation.navigate('BuyCreditRequestDetail', { purchaseId: item.id })
                  }
                />
              </View>
            ))
          )}
        </ScrollView>
      </AuthScaffold>
      <AppDialog
        visible={sentVisible}
        icon="check"
        title={t('dashboard.home.sentTitle')}
        message={t('dashboard.home.sentBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setSentVisible(false),
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 4,
  },
  card: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  cardInner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  qtyLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 20,
  },
  calc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  total: {
    fontSize: 16,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
  },
  section: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
