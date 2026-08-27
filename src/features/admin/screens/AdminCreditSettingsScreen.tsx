import React from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { adminApi } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';
import { getInputFontFamily } from '@/theme/typography';

import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminCreditsStackParamList } from '../navigation/adminNavigationTypes';

export function AdminCreditSettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCreditsStackParamList>>();
  const [unitPrice, setUnitPrice] = React.useState('');
  const [tripCreate, setTripCreate] = React.useState('');
  const [bidOffer, setBidOffer] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveErrorKey, setSaveErrorKey] = React.useState<string | null>(null);

  const { loading, errorKey } = useAdminResource({
    load: async () => {
      const settings = await adminApi.getCreditSettings();
      setUnitPrice(String(settings.unitPrice));
      setTripCreate(String(settings.tripCreateCredits));
      setBidOffer(String(settings.bidOfferCredits));
      return settings;
    },
  });

  const save = async () => {
    const nextPrice = Number(unitPrice);
    const nextTrip = Number(tripCreate);
    const nextBid = Number(bidOffer);
    if (
      ![nextPrice, nextTrip, nextBid].every((value) => Number.isInteger(value) && value >= 0)
    ) {
      setSaveErrorKey('admin.credits.settingsInvalid');
      return;
    }
    setSaving(true);
    setSaveErrorKey(null);
    try {
      await adminApi.updateCreditSettings({
        unitPrice: nextPrice,
        tripCreateCredits: nextTrip,
        bidOfferCredits: nextBid,
      });
      navigation.goBack();
    } catch {
      setSaveErrorKey('admin.credits.settingsSaveFailed');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { fontFamily: getInputFontFamily(currentLanguage) }];

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('admin.credits.settingsTitle')}
      subtitle={t('admin.credits.settingsSubtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
    >
      {errorKey || saveErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? saveErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field
            label={t('admin.credits.unitPriceLabel')}
            hint={t('admin.credits.unitPriceHint')}
            value={unitPrice}
            onChangeText={setUnitPrice}
            inputStyle={inputStyle}
          />
          <Field
            label={t('admin.credits.tripCreateLabel')}
            hint={t('admin.credits.tripCreateHint')}
            value={tripCreate}
            onChangeText={setTripCreate}
            inputStyle={inputStyle}
          />
          <Field
            label={t('admin.credits.bidOfferLabel')}
            hint={t('admin.credits.bidOfferHint')}
            value={bidOffer}
            onChangeText={setBidOffer}
            inputStyle={inputStyle}
          />
          <Button
            label={saving || loading ? t('admin.common.saving') : t('admin.common.save')}
            onPress={() => void save()}
            disabled={saving || loading}
          />
        </View>
      </ScrollView>
    </AuthScaffold>
  );
}

function Field({
  label,
  hint,
  value,
  onChangeText,
  inputStyle,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (text: string) => void;
  inputStyle: object[];
}): React.ReactElement {
  return (
    <View style={styles.field}>
      <AppText weight="semibold" style={styles.label}>
        {label}
      </AppText>
      <AppText style={styles.hint}>{hint}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={inputStyle}
      />
    </View>
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
  },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
    ...cardBackShadow,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
    fontSize: 16,
    color: colors.text.primary,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
