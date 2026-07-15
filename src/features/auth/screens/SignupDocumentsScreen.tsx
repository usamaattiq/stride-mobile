import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { AuthTextField } from '../components/AuthTextField';
import { DocumentUploadField } from '../components/DocumentUploadField';

type SignupDocumentsScreenProps = {
  nicNumber: string;
  nicFrontUri: string | null;
  nicBackUri: string | null;
  onChangeNicNumber: (value: string) => void;
  onChangeNicFront: (uri: string | null) => void;
  onChangeNicBack: (uri: string | null) => void;
  onContinue: () => void;
};

export function SignupDocumentsScreen({
  nicNumber,
  nicFrontUri,
  nicBackUri,
  onChangeNicNumber,
  onChangeNicFront,
  onChangeNicBack,
  onContinue,
}: SignupDocumentsScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue =
    nicNumber.trim().length >= 5 && Boolean(nicFrontUri) && Boolean(nicBackUri);

  return (
    <>
      <AuthCard>
        <AuthTextField
          label={t('auth.signup.documents.nicNumber')}
          required
          dense
          value={nicNumber}
          onChangeText={onChangeNicNumber}
          placeholder={t('auth.signup.documents.nicPlaceholder')}
          keyboardType="number-pad"
        />
        <DocumentUploadField
          label={t('auth.signup.documents.nicFront')}
          required
          dense
          uri={nicFrontUri}
          onChange={onChangeNicFront}
          hint={t('auth.signup.documents.uploadHint')}
          changeHint={t('auth.signup.documents.changeHint')}
        />
        <DocumentUploadField
          label={t('auth.signup.documents.nicBack')}
          required
          dense
          uri={nicBackUri}
          onChange={onChangeNicBack}
          hint={t('auth.signup.documents.uploadHint')}
          changeHint={t('auth.signup.documents.changeHint')}
        />
        <Button
          label={t('auth.signup.documents.cta')}
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
});
