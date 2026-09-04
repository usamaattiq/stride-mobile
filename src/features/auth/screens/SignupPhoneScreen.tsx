import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { PhoneInput } from '../components/PhoneInput';
import type { CountryOption } from '../constants/countries';
import { isLocalPhoneComplete } from '../utils/phone-identity';

type SignupPhoneScreenProps = {
  country: CountryOption;
  phoneDigits: string;
  onChangeCountry: (country: CountryOption) => void;
  onChangePhone: (digits: string) => void;
  onContinue: () => void;
  loading?: boolean;
  errorMessage?: string | null;
};

export function SignupPhoneScreen({
  country,
  phoneDigits,
  onChangeCountry,
  onChangePhone,
  onContinue,
  loading = false,
  errorMessage,
}: SignupPhoneScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = isLocalPhoneComplete(phoneDigits, country.phoneDigitLength) && !loading;

  return (
    <>
      <AuthCard>
        <PhoneInput
          value={phoneDigits}
          onChangeDigits={onChangePhone}
          country={country}
          onSelectCountry={onChangeCountry}
          placeholder={t('auth.signup.phone.placeholder')}
          onDone={onContinue}
        />
        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        <Button
          label={t('auth.signup.phone.cta')}
          onPress={onContinue}
          disabled={!canContinue}
          loading={loading}
        />
      </AuthCard>

      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: spacing.md,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
