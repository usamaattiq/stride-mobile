import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { IdentityDocumentVerification } from '@/shared/components/IdentityDocumentVerification';

import { AuthCard } from '../components/AuthCard';

type SignupDocumentsScreenProps = {
  nicNumber: string;
  nicFrontUri: string | null;
  nicBackUri: string | null;
  onChangeNicNumber: (value: string) => void;
  onChangeNicFront: (uri: string | null) => void;
  onChangeNicBack: (uri: string | null) => void;
  onContinue: () => void;
  onSkip?: () => void;
};

export function SignupDocumentsScreen({
  nicNumber,
  nicFrontUri,
  nicBackUri,
  onChangeNicNumber,
  onChangeNicFront,
  onChangeNicBack,
  onContinue,
  onSkip,
}: SignupDocumentsScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthCard>
      <IdentityDocumentVerification
        documentNumber={nicNumber}
        documentNumberLabel={t('auth.signup.documents.nicNumber')}
        documentNumberPlaceholder={t('auth.signup.documents.nicPlaceholder')}
        frontUri={nicFrontUri}
        backUri={nicBackUri}
        frontLabel={t('auth.signup.documents.nicFront')}
        backLabel={t('auth.signup.documents.nicBack')}
        uploadHint={t('auth.signup.documents.uploadHint')}
        changeHint={t('auth.signup.documents.changeHint')}
        submitLabel={t('auth.signup.documents.cta')}
        skipLabel={t('auth.signup.documents.skip')}
        onChangeDocumentNumber={onChangeNicNumber}
        onChangeFront={onChangeNicFront}
        onChangeBack={onChangeNicBack}
        onSubmit={onContinue}
        onSkip={onSkip}
      />
    </AuthCard>
  );
}
