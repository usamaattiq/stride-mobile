import React from 'react';
import {
  I18nManager,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { creditsApi, type CreditBankAccount, type CreditPurchase } from '@/services/api/creditsApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { uploadLocalFileToPresignedUrl } from '@/shared/services/mediaUploadService';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import { refreshSessionProfile } from '@/shared/utils/refresh-session-profile';
import { useConvertedAmount } from '@/shared/hooks/useConvertedAmount';
import { useDisplayCurrency } from '@/shared/utils/currency';
import { formatLatinNumber, formatPriceAmount, toLatinDigits } from '@/shared/utils/latin-digits';
import { colors, getInputFontFamily, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

function hasBankDetails(details: CreditBankAccount): boolean {
  return [details.bankName, details.accountTitle, details.accountNumber, details.iban].some(
    (value) => value.trim().length > 0,
  );
}

export function BuyCreditsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const currency = useDisplayCurrency();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user } = useDashboardSession();
  const [quantityText, setQuantityText] = React.useState('0');
  const [unitPriceUsd, setUnitPriceUsd] = React.useState(0);
  const [unitPricePkr, setUnitPricePkr] = React.useState(0);
  const [bankAccounts, setBankAccounts] = React.useState<CreditBankAccount[]>([]);
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
      setUnitPriceUsd(catalog.unitPrice);
      setUnitPricePkr(catalog.unitPricePkr);
      setBankAccounts(catalog.bankAccounts ?? []);
      setPurchases(list.items);
      await refreshSessionProfile();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.common.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const quantity = Number.parseInt(quantityText, 10) || 0;
  const totalPkr = quantity * unitPricePkr;
  const totalUsd = quantity * unitPriceUsd;
  const proofRequired = unitPricePkr > 0;
  const canSubmit = quantity >= 1 && (!proofRequired || Boolean(proofUri)) && !submitting;
  const isPkr = currency.toUpperCase() === 'PKR';
  const convertedUnitPrice = useConvertedAmount(unitPriceUsd, currency);
  const convertedTotal = useConvertedAmount(totalUsd, currency);
  const displayUnitPrice = isPkr ? unitPricePkr : convertedUnitPrice;
  const displayTotal = isPkr ? totalPkr : convertedTotal;
  const qtyFontFamily = getInputFontFamily(currentLanguage, 'number-pad');

  const setQuantity = (next: number) => {
    setQuantityText(String(Math.max(0, Math.min(99999, next))));
  };

  const onQuantityChange = (text: string) => {
    const digits = toLatinDigits(text).replace(/[^\d]/g, '');
    if (digits.length === 0) {
      setQuantityText('');
      return;
    }
    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed)) {
      return;
    }
    setQuantity(parsed);
  };

  const pickProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setProofUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      setError(t(proofRequired ? 'dashboard.home.required' : 'dashboard.home.requiredQuantity'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let proofUrl: string | undefined;
      if (proofRequired) {
        if (!proofUri) {
          setError(t('dashboard.home.required'));
          setSubmitting(false);
          return;
        }
        const uploaded = await uploadLocalFileToPresignedUrl(proofUri, {
          purpose: 'credit_purchase_proof',
        });
        proofUrl = uploaded.fileUrl;
      }
      await creditsApi.createPurchase({
        credits: quantity,
        ...(proofUrl ? { proofUrl } : {}),
      });
      setProofUri(null);
      setQuantityText('0');
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
              <View style={styles.qtyRow}>
                <AppText weight="medium" style={styles.qtyLabel} numberOfLines={1}>
                  {t('dashboard.home.currentCredits')}
                </AppText>
                <AppText weight="bold" style={styles.currentCreditsValue}>
                  {formatLatinNumber(user.credits)}
                </AppText>
              </View>
              <View style={styles.qtyRow}>
                <AppText weight="medium" style={styles.qtyLabel} numberOfLines={1}>
                  {t('dashboard.home.totalCredits')}
                </AppText>
                <View style={styles.qtyControls}>
                  <Pressable
                    onPress={() => setQuantity(quantity - 1)}
                    disabled={quantity <= 0}
                    style={({ pressed }) => [
                      styles.qtyButton,
                      quantity <= 0 && styles.qtyButtonDisabled,
                      pressed && quantity > 0 && styles.pressed,
                    ]}
                  >
                    <FontAwesome5
                      name="minus"
                      size={11}
                      color={quantity <= 0 ? colors.text.tertiary : colors.primary}
                      solid
                    />
                  </Pressable>
                  <TextInput
                    value={toLatinDigits(quantityText)}
                    onChangeText={onQuantityChange}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.text.tertiary}
                    style={[styles.qtyInput, { fontFamily: qtyFontFamily }]}
                    maxLength={5}
                  />
                  <Pressable
                    onPress={() => setQuantity(quantity + 1)}
                    disabled={quantity >= 99999}
                    style={({ pressed }) => [
                      styles.qtyButton,
                      quantity >= 99999 && styles.qtyButtonDisabled,
                      pressed && quantity < 99999 && styles.pressed,
                    ]}
                  >
                    <FontAwesome5
                      name="plus"
                      size={11}
                      color={quantity >= 99999 ? colors.text.tertiary : colors.primary}
                      solid
                    />
                  </Pressable>
                </View>
              </View>
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>{t('dashboard.home.ratePerCredit')}</AppText>
                <View style={styles.totalBlock}>
                  <AppText weight="semibold" style={styles.metaValue}>
                    {displayUnitPrice != null
                      ? t('dashboard.listings.card.priceWithCurrency', {
                          currency,
                          price: formatPriceAmount(displayUnitPrice),
                        })
                      : ''}
                  </AppText>
                </View>
              </View>
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>{t('dashboard.home.totalPrice')}</AppText>
                <View style={styles.totalBlock}>
                  {displayUnitPrice != null ? (
                    <AppText style={styles.totalCalc}>
                      {t('dashboard.home.creditsTimesPrice', {
                        count: quantity,
                        currency,
                        price: formatPriceAmount(displayUnitPrice),
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

          {proofRequired
            ? bankAccounts.filter(hasBankDetails).map((account, index) => (
            <View key={`${account.accountNumber}-${index}`} style={styles.shadowGutter}>
              <View style={styles.card}>
                <LinearGradient
                  colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
                  locations={[0, 0.28, 0.52, 0.78, 1]}
                  start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
                  end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                  style={styles.cardInner}
                >
                  <AppText weight="bold" style={styles.bankTitle}>
                    {t('dashboard.home.bankTitle')}
                    {bankAccounts.length > 1 ? ` ${index + 1}` : ''}
                  </AppText>
                  <View style={styles.bankDetailsCard}>
                    <BankRow label={t('dashboard.home.bankName')} value={account.bankName} />
                    <BankRow label={t('dashboard.home.accountTitle')} value={account.accountTitle} />
                    <BankRow label={t('dashboard.home.accountNumber')} value={account.accountNumber} />
                    <BankRow label={t('dashboard.home.iban')} value={account.iban} />
                  </View>
                </LinearGradient>
              </View>
            </View>
          ))
            : null}

          {proofRequired ? (
            <CreditPurchaseProofCard
              uri={proofUri}
              onPress={() => void pickProof()}
              compact
            />
          ) : null}
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <Button
            label={submitting ? t('dashboard.home.sending') : t('dashboard.home.sendRequest')}
            onPress={() => void submit()}
            disabled={!canSubmit}
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
                  createdAt={item.createdAt}
                  credits={item.credits}
                  amount={item.amount}
                  unitPrice={item.credits > 0 ? item.amount / item.credits : 0}
                  status={item.status}
                  compact
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

function BankRow({ label, value }: { label: string; value: string }): React.ReactElement | null {
  if (!value.trim()) {
    return null;
  }
  return (
    <View style={styles.bankRow}>
      <AppText style={styles.bankLabel}>{label}</AppText>
      <AppText weight="semibold" style={styles.bankValue} selectable>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: 2,
    paddingBottom: 2,
  },
  card: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  cardInner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    gap: 8,
  },
  qtyLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.text.primary,
  },
  currentCreditsValue: {
    fontSize: 16,
    color: colors.text.primary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.45,
  },
  qtyInput: {
    width: 68,
    minHeight: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xs,
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
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
  convertedHint: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  bankTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  bankDetailsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 6,
  },
  bankRow: {
    gap: 1,
  },
  bankLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  bankValue: {
    fontSize: 13,
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
