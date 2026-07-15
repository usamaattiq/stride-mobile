import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { AuthTextField } from '../components/AuthTextField';
import { ProfilePhotoPicker } from '../components/ProfilePhotoPicker';
import type { CountryOption } from '../constants/countries';
import { formatPhoneDisplay } from '../types/signup.types';

type SignupPersonalInfoScreenProps = {
  country: CountryOption;
  phoneDigits: string;
  fullName: string;
  email: string;
  address: string;
  profilePhotoUri: string | null;
  onChangeFullName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onChangePhoto: (uri: string | null) => void;
  onContinue: () => void;
};

export function SignupPersonalInfoScreen({
  country,
  phoneDigits,
  fullName,
  email,
  address,
  profilePhotoUri,
  onChangeFullName,
  onChangeEmail,
  onChangeAddress,
  onChangePhoto,
  onContinue,
}: SignupPersonalInfoScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = fullName.trim().length > 1 && address.trim().length > 3;

  return (
    <>
      <AuthCard>
        <ProfilePhotoPicker
          uri={profilePhotoUri}
          onChange={onChangePhoto}
          label={t('auth.signup.personal.photo')}
        />
        <AuthTextField
          label={t('auth.signup.personal.fullName')}
          value={fullName}
          onChangeText={onChangeFullName}
          placeholder={t('auth.signup.personal.fullNamePlaceholder')}
          autoCapitalize="words"
        />
        <AuthTextField
          label={t('auth.signup.personal.mobile')}
          value={formatPhoneDisplay(country, phoneDigits)}
          editable={false}
          selectTextOnFocus={false}
          style={styles.readonly}
        />
        <AuthTextField
          label={t('auth.signup.personal.email')}
          optional
          value={email}
          onChangeText={onChangeEmail}
          placeholder={t('auth.signup.personal.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthTextField
          label={t('auth.signup.personal.address')}
          value={address}
          onChangeText={onChangeAddress}
          placeholder={t('auth.signup.personal.addressPlaceholder')}
          multiline
          style={styles.address}
        />
        <Button
          label={t('auth.signup.personal.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
      </AuthCard>
      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  readonly: {
    backgroundColor: colors.background.subtle,
    color: colors.text.secondary,
  },
  address: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
});
