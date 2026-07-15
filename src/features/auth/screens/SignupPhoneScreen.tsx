import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { PhoneInput } from '../components/PhoneInput';
import type { CountryOption } from '../constants/countries';

type SignupPhoneScreenProps = {
  country: CountryOption;
  phoneDigits: string;
  onChangeCountry: (country: CountryOption) => void;
  onChangePhone: (digits: string) => void;
  onContinue: () => void;
};

export function SignupPhoneScreen({
  country,
  phoneDigits,
  onChangeCountry,
  onChangePhone,
  onContinue,
}: SignupPhoneScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = phoneDigits.length >= 10;

  return (
    <>
      <AuthCard>
        <PhoneInput
          value={phoneDigits}
          onChangeDigits={onChangePhone}
          country={country}
          onSelectCountry={onChangeCountry}
          placeholder={t('auth.signup.phone.placeholder')}
        />
        <Button
          label={t('auth.signup.phone.cta')}
          onPress={onContinue}
          disabled={!canContinue}
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
  
});
